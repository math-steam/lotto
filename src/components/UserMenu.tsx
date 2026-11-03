import { useState } from 'react';
import { ChevronDown, History, LogOut, User } from 'lucide-react';
import type { AuthUser } from '@/lib/supabase';

type UserMenuProps = {
  user: AuthUser;
  onLogout: () => void;
  onViewRecords: () => void;
};

export default function UserMenu({ user, onLogout, onViewRecords }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const displayName = user.name.length > 10 ? user.name.slice(0, 10) + '...' : user.name;
  const initials = user.name.charAt(0).toUpperCase();

  return (
    <div className="user-menu-wrapper">
      <button className="user-menu-button" onClick={() => setOpen((v) => !v)}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="user-avatar-img" />
        ) : (
          <span className="user-avatar-fallback">{initials}</span>
        )}
        <span className="user-menu-name">{displayName}</span>
        <ChevronDown size={14} className={`user-menu-chevron ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu-dropdown panel-frame">
            <div className="user-menu-info">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="user-avatar-img-lg" />
              ) : (
                <span className="user-avatar-fallback-lg"><User size={22} /></span>
              )}
              <div>
                <div className="user-menu-info-name">{user.name}</div>
                <div className="user-menu-info-detail">{user.email || user.phone || `已透過 ${user.provider} 登入`}</div>
              </div>
            </div>
            <div className="user-menu-divider" />
            <button className="user-menu-item" onClick={() => { onViewRecords(); setOpen(false); }}>
              <History size={16} /> 選號紀錄管理
            </button>
            <button className="user-menu-item user-menu-logout" onClick={() => { onLogout(); setOpen(false); }}>
              <LogOut size={16} /> 登出
            </button>
          </div>
        </>
      )}
    </div>
  );
}
