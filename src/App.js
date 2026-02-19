import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from './firebase';

const ADMIN_EMAIL = 'admin@flyntlok.com';
const CONSULTANT_EMAIL = 'consultant@flyntlok.com';

const PORTALS = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'Initial setup and system overview for new Flyntlok users.',
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
    description: 'Parts, equipment, and stock management workflows.',
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
    description: 'Customer relationship and sales process automation.',
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
    description: 'Work orders, technicians, and service tracking.',
    videos: [
      { id: 'svc-1', title: 'Creating Work Orders', duration: '11:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-2', title: 'Technician Time Tracking', duration: '8:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-3', title: 'Parts Allocation for Service', duration: '12:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'svc-4', title: 'Invoicing & Closing Work Orders', duration: '14:50', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ]
  }
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb';
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
      background: bg, color: '#fff', padding: '1rem 1.5rem', borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: '0.9rem', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideIn 0.3s ease-out'
    }}>
      <span>{type === 'success' ? '✓' : 'ℹ'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}>✕</button>
    </div>
  );
}

function LoginPage({ showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
          displayName: name,
          company,
          role: email === ADMIN_EMAIL ? 'admin' : 'client',
          createdAt: serverTimestamp()
        });
        showToast('Account created successfully!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a5f 0%, #2e69b3 100%)', padding: '1rem' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '1.25rem', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f', margin: 0 }}>Flyntlok Training</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{isRegister ? 'Join our learning community' : 'Sign in to your dashboard'}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} required style={inputStyle} />
            </>
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          <button type="submit" disabled={loading} style={{
            background: '#2563eb', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', transition: 'opacity 0.2s'
          }}>
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} style={{ width: '100%', background: 'none', border: 'none', color: '#2563eb', marginTop: '1.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' };

function Sidebar({ currentPortalId, onSelectPortal, userInfo, onLogout, isAdmin, onAdminView }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ width: collapsed ? '70px' : '260px', height: '100vh', background: '#1e3a5f', color: '#fff', position: 'fixed', display: 'flex', flexDirection: 'column', transition: 'width 0.3s' }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '1.5rem' }}>🎯</div>
        {!collapsed && <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Flyntlok Hub</span>}
      </div>
      <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {PORTALS.map(p => (
          <button key={p.id} onClick={() => onSelectPortal(p.id)} style={{
            width: '100%', padding: '0.75rem 1.5rem', background: currentPortalId === p.id ? 'rgba(255,255,255,0.1)' : 'none',
            border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <span>{p.icon}</span> {!collapsed && <span>{p.name}</span>}
          </button>
        ))}
        {isAdmin && (
          <button onClick={onAdminView} style={{
            width: '100%', padding: '0.75rem 1.5rem', background: currentPortalId === '__admin__' ? 'rgba(239, 68, 68, 0.2)' : 'none',
            border: 'none', color: '#fca5a5', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem'
          }}>
            <span>🛡️</span> {!collapsed && <span>Admin Dashboard</span>}
          </button>
        )}
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userInfo?.displayName}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{userInfo?.company}</div>
          </div>
        )}
        <button onClick={onLogout} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {!collapsed ? 'Logout' : '🚪'}
        </button>
      </div>
      <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'absolute', right: '-12px', top: '20px', width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
        {collapsed ? '→' : '←'}
      </button>
    </div>
  );
}

function VideoCard({ video, userUid, portalId, portalName, progress, showToast }) {
  const [playing, setPlaying] = useState(false);
  const isCompleted = progress?.status === 'completed';

  const handleMarkComplete = async () => {
    try {
      const pRef = progress?.docId ? doc(db, 'videoProgress', progress.docId) : collection(db, 'videoProgress');
      const data = {
        uid: userUid, portalId, portalName, videoId: video.id, videoTitle: video.title,
        status: 'completed', completedAt: serverTimestamp(), lastWatched: serverTimestamp()
      };
      if (progress?.docId) await updateDoc(pRef, data);
      else await addDoc(pRef, { ...data, startedAt: serverTimestamp() });

      // Trigger Email Integration (Writes to 'mail' collection for Firebase Extension)
      await addDoc(collection(db, 'mail'), {
        to: CONSULTANT_EMAIL,
        message: {
          subject: `Training Alert: ${video.title} Completed`,
          html: `<p>User <b>${userUid}</b> just completed <b>${video.title}</b> in the <b>${portalName}</b> portal.</p>`
        }
      });

      showToast(`Success! Consultant notified of completion.`, 'success');
    } catch (e) {
      showToast('Error updating progress.', 'error');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
        {playing ? (
          <iframe src={`${video.url}?autoplay=1`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
        ) : (
          <div onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(37,99,235,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff' }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{video.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{video.duration}</span>
          {isCompleted ? (
            <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.875rem' }}>✓ Completed</span>
          ) : (
            <button onClick={handleMarkComplete} style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PortalView({ portal, userUid, showToast }) {
  const [progressMap, setProgressMap] = useState({});
  useEffect(() => {
    if (!userUid || !portal) return;
    const q = query(collection(db, 'videoProgress'), where('uid', '==', userUid), where('portalId', '==', portal.id));
    return onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach(d => { map[d.data().videoId] = { ...d.data(), docId: d.id }; });
      setProgressMap(map);
    });
  }, [userUid, portal]);

  const total = portal.videos.length;
  const done = Object.values(progressMap).filter(p => p.status === 'completed').length;
  const pct = Math.round((done / total) * 100);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', padding: '2rem', borderRadius: '1rem', color: '#fff', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>{portal.icon}</span>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{portal.name}</h2>
            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8 }}>{portal.description}</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', height: '10px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#4ade80', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <span>Overall Progress</span>
          <span>{done} / {total} Videos ({pct}%)</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {portal.videos.map(v => <VideoCard key={v.id} video={v} userUid={userUid} portalId={portal.id} portalName={portal.name} progress={progressMap[v.id]} showToast={showToast} />)}
      </div>
    </div>
  );
}

function AdminDashboard({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'videoProgress'), orderBy('lastWatched', 'desc'));
    const unsubLogs = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uMap = {};
      snap.forEach(d => { uMap[d.data().uid] = d.data(); });
      setUsers(uMap);
    });
    return () => { unsubLogs(); unsubUsers(); };
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      await deleteDoc(doc(db, 'videoProgress', id));
      showToast('Record deleted.', 'info');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>🛡️ Admin Control Panel</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '1rem' }}>User / Company</th>
              <th style={{ padding: '1rem' }}>Video Content</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Last Activity</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700 }}>{users[log.uid]?.displayName || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{users[log.uid]?.company || 'N/A'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{log.videoTitle}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{log.portalName}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, background: log.status === 'completed' ? '#d1fae5' : '#fef3c7', color: log.status === 'completed' ? '#065f46' : '#92400e' }}>
                    {log.status?.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', opacity: 0.7 }}>{log.lastWatched?.toDate().toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => handleDelete(log.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [view, setView] = useState(PORTALS[0].id);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const q = query(collection(db, 'users'), where('uid', '==', u.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setUserInfo(snap.docs[0].data());
      } else {
        setUser(null);
        setUserInfo(null);
      }
    });
  }, []);

  const showToast = (message, type) => setToast({ message, type });

  if (user === undefined) return null;
  if (!user) return <><LoginPage showToast={showToast} />{toast && <Toast {...toast} onClose={() => setToast(null)} />}</>;

  const isAdmin = userInfo?.role === 'admin' || user.email === ADMIN_EMAIL;
  const currentPortal = PORTALS.find(p => p.id === view);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar currentPortalId={view} onSelectPortal={setView} userInfo={userInfo} onLogout={() => signOut(auth)} isAdmin={isAdmin} onAdminView={() => setView('__admin__')} />
      <main style={{ flex: 1, padding: '2rem', marginLeft: '260px' }}>
        {view === '__admin__' ? <AdminDashboard showToast={showToast} /> : <PortalView portal={currentPortal} userUid={user.uid} showToast={showToast} />}
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <style>{`@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
