const fs = require('fs');

const keys = [
  'Eye', 'EyeOff', 'Mail', 'Lock', 'ChevronLeft', 'ArrowRight', 'User', 'AlertTriangle', 'ArrowLeft', 'Trash2', 'CheckCircle', 'Bell', 'Smartphone', 'ShoppingCart', 'Package', 'CreditCard', 'Gift', 'AlertCircle', 'Loader2', 'LogOut', 'Shield', 'Camera', 'MapPin', 'Activity', 'Flame', 'HeartPulse', 'Plus', 'Settings2', 'Users', 'CheckCircle2', 'ActivitySquare', 'AlertOctagon', 'TrendingDown', 'Send', 'TrendingUp', 'Minus', 'History', 'Megaphone', 'X', 'Pencil', 'UserCheck', 'CalendarClock', 'UserX', 'ChevronDown', 'ChevronUp', 'AlignLeft', 'Heart', 'UserPlus', 'BarChart3', 'Link', 'Utensils', 'Sparkles', 'MessageSquare', 'MessageCircle', 'LayoutDashboard', 'GripHorizontal', 'Copy', 'Share2', 'Calendar', 'Circle', 'Clock', 'MoreVertical', 'PlayCircle', 'UserCircle2', 'MoreHorizontal', 'FileSignature', 'FileText', 'Save', 'Phone', 'Check', 'Receipt', 'Settings', 'Coins', 'Search', 'DollarSign', 'PenTool', 'LayoutTemplate', 'ShieldAlert', 'GraduationCap', 'BookOpen', 'ThumbsUp', 'Timer', 'CalendarCheck', 'Target', 'KanbanSquare', 'RefreshCw', 'ClipboardList', 'Image', 'FileVideo', 'Scale', 'Crown', 'Flag', 'Briefcase', 'CalendarX2', 'Zap', 'Star', 'Moon', 'Brain', 'CheckCheck', 'Trophy', 'Shuffle', 'Wallet', 'ChevronRight', 'Mic', 'MicOff', 'PhoneCall', 'PhoneOff', 'Undo', 'Type', 'Eraser', 'ExternalLink', 'Bot', 'Paperclip', 'Download', 'Layers', 'File', 'Edit2', 'BrainCircuit', 'PieChart', 'ShoppingBag', 'Smile', 'Frown', 'Meh', 'Music', 'Scan', 'Layout', 'Laptop', 'Pill', 'ArrowUp', 'HelpCircle', 'Mountain', 'RotateCcw', 'LayoutGrid', 'FlaskConical', 'Info', 'BadgeCheck', 'Quote', 'ShieldCheck', 'ScrollText', 'KeyRound', 'Home', 'Share', 'Menu', 'Sun', 'Cloud', 'Filter', 'Medal', 'Scissors', 'Volume2', 'VolumeX', 'Wifi', 'WifiOff', 'XCircle', 'Truck', 'Tag', 'Cog', 'Globe', 'Building2', 'Play', 'Pause', 'SkipForward', 'Minimize2', 'Maximize2', 'Coffee', 'PlusSquare', 'Unlock', 'Upload', 'UserCircle', 'Move', 'ZoomIn', 'ZoomOut', 'CalendarRange', 'BatteryCharging', 'MousePointer2', 'RefreshCcw', 'Leaf',
  
  'getAuth', 'sendSignInLinkToEmail', 'isSignInWithEmailLink', 'signInWithEmailLink', 'setPersistence', 'browserLocalPersistence',
  'collection', 'doc', 'setDoc', 'addDoc', 'onSnapshot', 'query', 'orderBy', 'serverTimestamp', 'getDoc', 'deleteDoc', 'updateDoc', 'arrayUnion', 'writeBatch', 'where', 'getDocs', 'increment', 'limit', 'Timestamp', 'runTransaction', 'arrayRemove', 'getCountFromServer', 'getFirestore', 'FieldValue', 'DocumentData', 'QueryDocumentSnapshot', 'SnapshotOptions', 'FirestoreDataConverter', 'PartialWithFieldValue',
  'ref', 'uploadBytes', 'getDownloadURL', 'uploadString', 'uploadBytesResumable', 'getStorage',
  'onChildAdded', 'onValue', 'push', 'set', 'off', 'getDatabase',
  'getMessaging', 'getToken', 'isSupported',
  'initializeApp', 'getApps', 'getApp',
  'getAnalytics',
  
  'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'RadarChart', 'PolarGrid', 'PolarAngleAxis', 'PolarRadiusAxis', 'Radar', 'Pie', 'Cell', 'Legend', 'AreaChart', 'Area',
  
  // livekit
  'LiveKitRoom', 'RoomAudioRenderer', 'ControlBar', 'ConnectionStateToast', 'useParticipants', 'ParticipantName',
  
  // toss
  'loadPaymentWidget'
];

const header = `import React from 'react';

const DummyComponent = function(props) {
  return React.createElement('div', Object.assign({}, props, { ref: undefined }), "");
};

// Return a dummy object for firebase functions so they don't crash when chained
const createDummyFn = () => {
  const dummyFn = () => dummyFn;
  return dummyFn;
};
`;

const body = keys.map(k => {
  if (k === 'getApps') return `export const getApps = () => [];`;
  if (k === 'isSupported') return `export const isSupported = () => Promise.resolve(false);`;
  if (k === 'getDoc' || k === 'getDocs') return `export const ${k} = () => Promise.resolve({ exists: () => false, data: () => ({}), forEach: () => {} });`;
  
  // For icons and react components (starts with uppercase)
  if (/^[A-Z]/.test(k)) {
    return `export const ${k} = DummyComponent;`;
  }
  
  // For other lowercase functions (firebase etc)
  return `export const ${k} = createDummyFn();`;
}).join('\n');

fs.writeFileSync('src/lib/empty-mock.js', header + '\n' + body + '\nexport default DummyComponent;\n');
