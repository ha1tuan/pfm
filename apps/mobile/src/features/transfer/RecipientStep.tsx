import { Hash, Landmark, Search, Smartphone, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { lookupBankAccount, lookupWallet, useBankCatalog, useContacts } from '@/api/queries';
import { BankTile } from '@/components/finance/BankAccountCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ListItem } from '@/components/ui/ListItem';
import { ScrollBody, SectionTitle } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import type { Bank, Recipient } from '@/domain/types';
import type { Contact } from '@/mocks/seed';
import { t } from '@/i18n';
import { maskPhone } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';

const toRecipient = (c: Contact): Recipient =>
  c.kind === 'wallet' ? { kind: 'wallet', name: c.name, phone: c.phone! } : { kind: 'bank', name: c.name, bank: c.bank!, accountNumber: c.accountNumber! };

const contactSubtitle = (c: Contact) =>
  c.kind === 'wallet' ? `${t('common.walletName')} · ${maskPhone(c.phone!)}` : `${c.bank!.name} · ${c.accountNumber}`;

function WalletSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (r: Recipient) => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const check = async (value: string) => {
    setPhone(value);
    setName(null);
    setError(undefined);
    if (value.replace(/\D/g, '').length !== 10) return;
    setBusy(true);
    try {
      setName(await lookupWallet(value));
    } catch {
      setError(t('login.phoneInvalid'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('transfer.walletSheetTitle')}
      actions={
        <Button
          label={t('common.continue')}
          size="lg"
          fullWidth
          loading={busy}
          disabled={!name}
          onPress={() => name && onPick({ kind: 'wallet', name, phone })}
        />
      }
    >
      <Input
        label={t('transfer.phoneLabel')}
        icon={Smartphone}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={check}
        hint={name ? t('transfer.holderHint', { name }) : undefined}
        error={error}
        autoFocus
      />
    </Sheet>
  );
}

function BankSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (r: Recipient) => void }) {
  const { data: banks } = useBankCatalog();
  const [bank, setBank] = useState<Bank | null>(null);
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setBusy(true);
    const name = await lookupBankAccount(account);
    setHolder(name);
    setBusy(false);
    return name;
  };

  const confirm = async () => {
    if (!bank) return;
    const name = holder ?? (await lookup());
    onPick({ kind: 'bank', name, bank, accountNumber: account });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('transfer.bankSheetTitle')}
      actions={
        <Button
          label={t('common.continue')}
          size="lg"
          fullWidth
          loading={busy}
          disabled={!bank || account.replace(/\D/g, '').length < 8}
          onPress={confirm}
        />
      }
    >
      <Text variant="label">{t('transfer.bankLabel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankRow}>
        {(banks ?? []).map((b) => (
          <Pressable
            key={b.code}
            onPress={() => {
              setBank(b);
              setHolder(null);
            }}
            style={[styles.bankChip, bank?.code === b.code ? styles.bankChipOn : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: bank?.code === b.code }}
          >
            <BankTile code={b.code} short={b.short} size={36} />
            <Text style={styles.bankName}>{b.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Input
        label={t('transfer.accountLabel')}
        icon={Hash}
        keyboardType="number-pad"
        value={account}
        onChangeText={(v) => {
          setAccount(v);
          setHolder(null);
        }}
        onBlur={() => bank && account && lookup()}
        hint={holder ? t('transfer.holderHint', { name: holder }) : undefined}
      />
    </Sheet>
  );
}

export function RecipientStep({ onPick }: { onPick: (r: Recipient) => void }) {
  const { data: contacts = [] } = useContacts();
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<'wallet' | 'bank' | null>(null);
  const q = query.trim().toLowerCase();
  const filtered = contacts.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q) || (c.accountNumber ?? '').replace(/\s/g, '').includes(q),
  );

  const pick = (r: Recipient) => {
    setSheet(null);
    onPick(r);
  };

  return (
    <ScrollBody>
      <Input icon={Search} placeholder={t('transfer.search')} value={query} onChangeText={setQuery} />

      {!q ? (
        <>
          <SectionTitle title={t('transfer.recent')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recent}>
            {contacts.map((c) => (
              <Pressable key={c.name} onPress={() => pick(toRecipient(c))} style={styles.recentItem} accessibilityRole="button">
                <Avatar name={c.name} size={56} />
                <Text style={styles.recentName} numberOfLines={1}>
                  {c.name.split(' ').slice(-1)[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <SectionTitle title={t('transfer.destination')} />
          <Card padding={{ vertical: 0, horizontal: 16 }}>
            <ListItem icon={Wallet} title={t('transfer.toWallet')} subtitle={t('transfer.toWalletSub')} chevron divider onPress={() => setSheet('wallet')} />
            <ListItem icon={Landmark} title={t('transfer.toBank')} subtitle={t('transfer.toBankSub')} chevron onPress={() => setSheet('bank')} />
          </Card>
        </>
      ) : null}

      <SectionTitle title={t('transfer.saved')} />
      <Card padding={{ vertical: 0, horizontal: 16 }}>
        {filtered.map((c, i) => (
          <ListItem
            key={c.name}
            leading={<Avatar name={c.name} size={44} />}
            title={c.name}
            subtitle={contactSubtitle(c)}
            divider={i < filtered.length - 1}
            onPress={() => pick(toRecipient(c))}
          />
        ))}
      </Card>

      <WalletSheet open={sheet === 'wallet'} onClose={() => setSheet(null)} onPick={pick} />
      <BankSheet open={sheet === 'bank'} onClose={() => setSheet(null)} onPick={pick} />
    </ScrollBody>
  );
}

const styles = StyleSheet.create({
  recent: { gap: 16 },
  recentItem: { width: 64, alignItems: 'center', gap: 6 },
  recentName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textBody },
  bankRow: { gap: 8, paddingVertical: 10 },
  bankChip: {
    width: 84,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    backgroundColor: '#fff',
  },
  bankChipOn: { borderColor: colors.green500, backgroundColor: colors.green50 },
  bankName: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textBody, textAlign: 'center' },
});

export const recipientDetail = (r: Recipient) =>
  r.kind === 'wallet' ? `${t('common.walletName')} · ${maskPhone(r.phone)}` : `${r.bank.name} · ${r.accountNumber}`;
