import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, onSnapshot, writeBatch
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from './firebase';

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@flyntlok.com';

const PORTALS = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'Initial setup and system overview',
    videos: [
      { id: 'gs-1', title: 'System Overview & Navigation', duration: '12:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'gs-2', title: 'User Account Setup', duration: '8:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'gs-3', title: 'Dashboard Introduction', duration: '10:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'gs-4', title: 'Basic Settings Configuration', duration: '15:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    icon: '📦',
    description: 'Parts, equipment, and stock management',
    videos: [
      { id: 'inv-1', title: 'Adding New Inventory Items', duration: '9:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'inv-2', title: 'Stock Level Management', duration: '11:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'inv-3', title: 'Purchase Orders', duration: '14:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'inv-4', title: 'Inventory Reports', duration: '7:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  },
  {
    id: 'sales-crm',
    name: 'Sales & CRM',
    icon: '💼',
    description: 'Customer relationship and sales process',
    videos: [
      { id: 'crm-1', title: 'Customer Profile Management', duration: '13:10', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'crm-2', title: 'Creating Sales Deals', duration: '16:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'crm-3', title: 'Lead Tracking', duration: '10:40', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  },
  {
    id: 'service-department',
    name: 'Service Department',
    icon: '🔧',
    description: 'Work orders, technicians, and service tracking',
    videos: [
      { id: 'svc-1', title: 'Creating Work Orders', duration: '11:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-2', title: 'Technician Time Tracking', duration: '8:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-3', title: 'Parts Allocation for Service', duration: '12:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-4', title: 'Invoicing & Closing Work Orders', duration: '14:50', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  },
  {
    id: 'reporting-analytics',
    name: 'Reporting & Analytics',
    icon: '📊',
    description: 'Business intelligence and data reporting',
    videos: [
      { id: 'rpt-1', title: 'Sales Reports Overview', duration: '9:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'rpt-2', title: 'Inventory Analytics', duration: '11:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'rpt-3', title: 'Custom Report Builder', duration: '18:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  }
];

// ─── Toast Component ──────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
      background: bg, color: '#fff', padding: '0.8rem 1.2rem',
      borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontSize: '0.9rem', maxWidth: '360px', display: 'flex',
      alignItems: 'center', gap: '0.5rem', animation: 'slideIn 0.3s ease'
    }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✗' : 'i'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{
        marginLeft: 'auto', background: 'transparent', border: 'none',
        color: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1
      }}>x</button>
    </div>
  );
}

// ─── Login Component ──────────────────────────────────────────────────────────────
function LoginPage({ showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'users'), {
          uid: cred.user.uid,
          email,
          displayName: displayName || email.split('@')[0],
          company: company || 'N/A',
          role: email === ADMIN_EMAIL ? 'admin' : 'client',
          createdAt: serverTimestamp()
        });
        showToast('Account created! Welcome to the Training Portal.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back!', 'success');
      }
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2e69b3 50%, #1a2f5a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2.5rem',
        width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <h1 style={{ color: '#1e3a5f', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            Flyntlok Training Portal
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isRegister ? 'Create your account' : 'Sign in to access your training'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Full Name
                </label>
                <input
                  type="text" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Smith"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Company
                </label>
                <input
                  type="text" value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your Company Name"
                  style={inputStyle}
                />
              </div>
            </>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
              Email Address
            </label>
            <input
              type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
              Password
            </label>
            <input
              type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.75rem', background: loading ? '#9ca3af' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: '0.5rem',
            fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Admin: admin@flyntlok.com
        </p>
      </div>
    </div>
  );
}

// Style constants
const inputStyle = {
  width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db',
  borderRadius: '0.375rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

const cardStyle = {
  background: '#fff', borderRadius: '0.75rem', padding: '1.25rem',
  border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  transition: 'all 0.2s'
};

// ─── Sidebar Component ───────────────────────────────────────────────────────────
function Sidebar({ currentPortal, onSelectPortal, userInfo, onLogout, isAdmin, onAdminView }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      width: collapsed ? '64px' : '260px', minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e3a5f 0%, #1a3354 100%)',
      borderRight: '1px solid #2d4a6e', display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s ease', position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 100, overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)', gap: '0.75rem'
      }}>
        <div style={{
          width: '36px', height: '36px', background: '#2563eb', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', flexShrink: 0
        }}>🎯</div>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Flyntlok</div>
            <div style={{ color: '#93c5fd', fontSize: '0.72rem' }}>Training Portal</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: '#93c5fd', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem', flexShrink: 0
          }}
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
        {!collapsed && (
          <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Training Modules
          </div>
        )}
        {PORTALS.map((portal) => (
          <button
            key={portal.id}
            onClick={() => onSelectPortal(portal.id)}
            title={collapsed ? portal.name : ''}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.75rem 1rem' : '0.625rem 1rem',
              background: currentPortal === portal.id ? 'rgba(37,99,235,0.3)' : 'transparent',
              border: 'none', borderLeft: currentPortal === portal.id ? '3px solid #60a5fa' : '3px solid transparent',
              color: currentPortal === portal.id ? '#93c5fd' : '#cbd5e1',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              fontSize: '0.875rem'
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{portal.icon}</span>
            {!collapsed && <span style={{ fontWeight: currentPortal === portal.id ? 600 : 400 }}>{portal.name}</span>}
          </button>
        ))}
        {isAdmin && (
          <>
            {!collapsed && (
              <div style={{ padding: '0.75rem 1rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1rem' }}>
                Administration
              </div>
            )}
            <button
              onClick={onAdminView}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: collapsed ? '0.75rem 1rem' : '0.625rem 1rem',
                background: currentPortal === '__admin__' ? 'rgba(220,38,38,0.2)' : 'transparent',
                border: 'none', borderLeft: currentPortal === '__admin__' ? '3px solid #f87171' : '3px solid transparent',
                color: currentPortal === '__admin__' ? '#fca5a5' : '#cbd5e1',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontSize: '0.875rem'
              }}
              title={collapsed ? 'Admin Dashboard' : ''}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🛡️</span>
              {!collapsed && <span style={{ fontWeight: currentPortal === '__admin__' ? 600 : 400 }}>Admin Dashboard</span>}
            </button>
          </>
        )}
      </nav>

      {/* User Info */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userInfo?.displayName || userInfo?.email?.split('@')[0]}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userInfo?.company || userInfo?.email}
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '0.5rem', background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.375rem',
            color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
          title={collapsed ? 'Sign Out' : ''}
        >
          <span>🚪</span>
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

// ─── Video Card Component ──────────────────────────────────────────────────────────────
function VideoCard({ video, userUid, portalId, portalName, progress, showToast }) {
  const [playing, setPlaying] = useState(false);
  const [marking, setMarking] = useState(false);
  const completed = progress && progress.status === 'completed';
  const inProgress = progress && progress.status === 'in_progress';

  const handleWatch = async () => {
    setPlaying(true);
    if (!progress || progress.status === 'not_started') {
      setMarking(true);
      try {
        if (progress && progress.docId) {
          await updateDoc(doc(db, 'videoProgress', progress.docId), {
            status: 'in_progress',
            lastWatched: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'videoProgress'), {
            uid: userUid,
            portalId,
            portalName,
            videoId: video.id,
            videoTitle: video.title,
            status: 'in_progress',
            startedAt: serverTimestamp(),
            lastWatched: serverTimestamp()
          });
        }
      } catch (e) {
        console.error('Error saving progress:', e);
      } finally {
        setMarking(false);
      }
    }
  };

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      if (progress && progress.docId) {
        await updateDoc(doc(db, 'videoProgress', progress.docId), {
          status: 'completed',
          completedAt: serverTimestamp(),
          lastWatched: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'videoProgress'), {
          uid: userUid,
          portalId,
          portalName,
          videoId: video.id,
          videoTitle: video.title,
          status: 'completed',
          startedAt: serverTimestamp(),
          completedAt: serverTimestamp(),
          lastWatched: serverTimestamp()
        });
      }
      showToast(`Marked "${video.title}" as complete!`, 'success');
    } catch (e) {
      showToast('Error saving progress', 'error');
    } finally {
      setMarking(false);
    }
  };

  const statusColor = completed ? '#16a34a' : inProgress ? '#d97706' : '#6b7280';
  const statusBg = completed ? '#f0fdf4' : inProgress ? '#fffbeb' : '#f9fafb';
  const statusLabel = completed ? 'Completed' : inProgress ? 'In Progress' : 'Not Started';
  const statusIcon = completed ? '✓' : inProgress ? '▶' : '○';

  return (
    <div style={{
      ...cardStyle,
      border: completed ? '1px solid #86efac' : inProgress ? '1px solid #fcd34d' : '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
            {video.title}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{video.duration}</span>
        </div>
        <span style={{
          padding: '0.25rem 0.625rem', borderRadius: '9999px',
          fontSize: '0.72rem', fontWeight: 600, color: statusColor,
          background: statusBg, border: `1px solid ${statusColor}40`, marginLeft: '0.75rem'
        }}>
          {statusIcon} {statusLabel}
        </span>
      </div>

      {playing ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <iframe
            src={`${video.url}?autoplay=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={video.title}
          />
        </div>
      ) : (
        <div
          onClick={handleWatch}
          style={{
            position: 'relative', paddingBottom: '40%', height: 0, background: '#0f172a',
            borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer', marginBottom: '0.75rem'
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <div style={{
              width: '48px', height: '48px', background: 'rgba(37,99,235,0.9)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem'
            }}>▶</div>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Click to watch</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {!playing && (
          <button
            onClick={handleWatch}
            style={{
              flex: 1, padding: '0.5rem', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600
            }}
          >
            {inProgress ? 'Continue Watching' : 'Watch Video'}
          </button>
        )}
        {!completed && (
          <button
            onClick={handleMarkComplete}
            disabled={marking}
            style={{
              flex: playing ? 1 : 0, padding: '0.5rem 0.75rem',
              background: marking ? '#9ca3af' : '#16a34a', color: '#fff',
              border: 'none', borderRadius: '0.375rem',
              cursor: marking ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600
            }}
          >
            {marking ? '...' : (playing ? '✓ Mark Complete' : '✓')}
          </button>
        )}
        {completed && (
          <div style={{
            flex: 1, padding: '0.5rem', background: '#f0fdf4', color: '#16a34a',
            border: '1px solid #86efac', borderRadius: '0.375rem',
            fontSize: '0.8rem', fontWeight: 600, textAlign: 'center'
          }}>
            ✓ Completed
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Portal View Component ─────────────────────────────────────────────────────────────
function PortalView({ portal, userUid, showToast }) {
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    if (!userUid || !portal) return;
    const q = query(
      collection(db, 'videoProgress'),
      where('uid', '==', userUid),
      where('portalId', '==', portal.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach((d) => {
        map[d.data().videoId] = { ...d.data(), docId: d.id };
      });
      setProgressMap(map);
    });
    return unsub;
  }, [userUid, portal]);

  if (!portal) return null;
  const totalVideos = portal.videos.length;
  const completed = Object.values(progressMap).filter(p => p.status === 'completed').length;
  const inProgress = Object.values(progressMap).filter(p => p.status === 'in_progress').length;
  const pct = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;

  return (
    <div>
      {/* Portal Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>{portal.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{portal.name}</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>{portal.description}</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '8px' }}>
            <div style={{
              width: `${pct}%`, height: '100%', background: '#4ade80',
              borderRadius: '9999px', transition: 'width 0.5s ease'
            }} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
            {completed}/{totalVideos} ({pct}%)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
          <span style={{ color: '#4ade80' }}>✓ {completed} Completed</span>
          <span style={{ color: '#fbbf24' }}>▶ {inProgress} In Progress</span>
          <span style={{ color: '#94a3b8' }}>○ {totalVideos - completed - inProgress} Not Started</span>
        </div>
      </div>

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {portal.videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            userUid={userUid}
            portalId={portal.id}
            portalName={portal.name}
            progress={progressMap[video.id] || null}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Admin Dashboard Component ────────────────────────────────────────────────────────
function AdminDashboard({ showToast }) {
  const [trackingData, setTrackingData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'videoProgress'), orderBy('lastWatched', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      setTrackingData(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const u = {};
      snap.forEach(d => { u[d.data().uid] = d.data(); });
      setUsers(u);
    });
    return unsub;
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to permanently delete this tracking record?')) return;
    try {
      await deleteDoc(doc(db, 'videoProgress', docId));
      showToast('Record deleted successfully from Firestore.', 'success');
    } catch (e) {
      showToast('Error deleting record', 'error');
    }
  };

  const filteredData = trackingData.filter(d => 
    d.videoTitle?.toLowerCase().includes(filter.toLowerCase()) ||
    users[d.uid]?.email?.toLowerCase().includes(filter.toLowerCase()) ||
    users[d.uid]?.displayName?.toLowerCase().includes(filter.toLowerCase()) ||
    d.portalName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>🛡️ Admin Tracking Dashboard</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Monitor user progress across all portals</p>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search users, videos, or portals..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1',
              width: '300px', fontSize: '0.875rem', outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>User / Company</th>
              <th style={{ padding: '1rem' }}>Portal</th>
              <th style={{ padding: '1rem' }}>Video Title</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Last Activity</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading tracking data...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No tracking records found.</td></tr>
            ) : (
              filteredData.map((record) => (
                <tr key={record.docId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{users[record.uid]?.displayName || 'Unknown User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{users[record.uid]?.company || record.uid.substring(0,8)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{record.portalName}</td>
                  <td style={{ padding: '1rem', color: '#1e293b' }}>{record.videoTitle}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                      background: record.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                      color: record.status === 'completed' ? '#16a34a' : '#d97706',
                      border: `1px solid ${record.status === 'completed' ? '#86efac' : '#fcd34d'}`
                    }}>
                      {record.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                    {record.lastWatched?.toDate().toLocaleString() || 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(record.docId)}
                      style={{
                        padding: '0.4rem 0.6rem', background: '#fee2e2', color: '#dc2626',
                        border: '1px solid #fecaca', borderRadius: '0.375rem',
                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main App Component ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [currentPortalId, setCurrentPortalId] = useState(PORTALS[0].id);
  const [toast, setToast] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const q = query(collection(db, 'users'), where('uid', '==', u.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUserInfo(snap.docs[0].data());
        }
      } else {
        setUser(null);
        setUserInfo(null);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  const handleLogout = () => signOut(auth);

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Portal...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage showToast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  const isAdmin = userInfo?.role === 'admin' || user.email === ADMIN_EMAIL;
  const currentPortal = PORTALS.find(p => p.id === currentPortalId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar
        currentPortal={currentPortalId}
        onSelectPortal={setCurrentPortalId}
        userInfo={userInfo}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onAdminView={() => setCurrentPortalId('__admin__')}
      />

      <main style={{
        flex: 1,
        marginLeft: '260px', // Sidebar width - update if sidebar collapsed
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto 0 260px',
        transition: 'margin-left 0.3s ease'
      }}>
        {currentPortalId === '__admin__' ? (
          <AdminDashboard showToast={showToast} />
        ) : (
          <PortalView
            portal={currentPortal}
            userUid={user.uid}
            showToast={showToast}
          />
        )}
      </main>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
