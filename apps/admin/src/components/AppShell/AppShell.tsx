import { Badge as AntBadge, Button, Input } from 'antd';
import clsx from 'clsx';
import {
  ArrowLeftRight,
  Bell,
  Gauge,
  LayoutDashboard,
  Percent,
  ScrollText,
  Search,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useMatches, useNavigate, useParams } from 'react-router-dom';
import { currentStaff, findWallet } from '@/api/queries';
import { Logo } from '@/components/Logo/Logo';
import { PersonAvatar } from '@/components/PersonAvatar/PersonAvatar';
import { TransactionDrawer } from '@/components/TransactionDrawer/TransactionDrawer';
import { t, type I18nKey } from '@/i18n';
import styles from './AppShell.module.scss';

export interface RouteHandle {
  title: I18nKey;
  crumb: I18nKey;
}

const NAV: { to: string; label: I18nKey; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'nav.transactions', icon: ArrowLeftRight },
  { to: '/wallets', label: 'nav.wallets', icon: Wallet },
  { to: '/config/fees', label: 'nav.fees', icon: Percent },
  { to: '/config/limits', label: 'nav.limits', icon: Gauge },
  { to: '/audit', label: 'nav.audit', icon: ScrollText },
];

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Logo tone="light" className={styles.logo} />
      <div className={styles.console}>{t('app.console')}</div>
      <nav className={styles.nav}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}>
            <Icon size={19} className={styles.navIcon} />
            {t(label)}
          </NavLink>
        ))}
      </nav>
      <div className={styles.health}>
        <div className={styles.healthTitle}>
          <span className={styles.healthDot} />
          {t('app.bankStatusTitle')}
        </div>
        {t('app.bankStatusBody')}
      </div>
    </aside>
  );
}

function Topbar() {
  const matches = useMatches();
  const params = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const handle = [...matches].reverse().find((m) => m.handle)?.handle as RouteHandle | undefined;
  const staff = currentStaff();

  // Global search: a transaction id opens its drawer, anything else is treated as a wallet lookup.
  const search = async (value: string) => {
    const q = value.trim();
    if (!q) return;
    if (/^txn-/i.test(q)) {
      navigate(`/transactions?tx=${encodeURIComponent(q.toUpperCase())}`);
      return;
    }
    const wallet = await findWallet(q);
    navigate(wallet ? `/wallets/${wallet.id}` : `/wallets?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.titleBlock}>
        {handle ? <div className={styles.crumb}>{t(handle.crumb)}</div> : null}
        <h1 className={styles.title}>{handle ? t(handle.title, { id: params.walletId ?? '' }) : null}</h1>
      </div>
      <Input
        className={styles.search}
        prefix={<Search size={16} className={styles.searchIcon} />}
        placeholder={t('app.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPressEnter={() => search(query)}
        allowClear
      />
      <AntBadge dot offset={[-6, 6]}>
        <Button shape="circle" size="large" icon={<Bell size={18} />} aria-label={t('app.notifications')} />
      </AntBadge>
      <div className={styles.staff}>
        <PersonAvatar name={staff.name} />
        <div>
          <div className={styles.staffName}>{staff.name}</div>
          <div className={styles.staffRole}>{t(`role.${staff.role}`)}</div>
        </div>
      </div>
    </header>
  );
}

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <TransactionDrawer />
    </div>
  );
}
