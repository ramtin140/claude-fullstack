import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, data) => fs.writeFileSync(path.join(root, file), data);

function insertAfter(source, needle, insertion) {
  if (source.includes(insertion.trim())) return source;
  if (!source.includes(needle)) throw new Error(`Needle not found: ${needle}`);
  return source.replace(needle, `${needle}\n${insertion}`);
}

function insertBefore(source, needle, insertion) {
  if (source.includes(insertion.trim())) return source;
  if (!source.includes(needle)) throw new Error(`Needle not found: ${needle}`);
  return source.replace(needle, `${insertion}\n${needle}`);
}

// App.jsx: add imports and routes.
let app = read('frontend/src/App.jsx');
app = insertAfter(app, "import Dashboard from './pages/Dashboard.jsx';", "import Wallet from './pages/Wallet.jsx';\nimport H2HMatches from './pages/H2HMatches.jsx';\nimport H2HMatchDetail from './pages/H2HMatchDetail.jsx';");
app = insertAfter(app, "import AdminUsers from './pages/admin/AdminUsers.jsx';", "import AdminH2HReview from './pages/admin/AdminH2HReview.jsx';\nimport AdminEconomy from './pages/admin/AdminEconomy.jsx';");
app = insertBefore(app, '  <Route\n\n  path="/dashboard"', `  <Route\n    path="/wallet"\n    element={\n      <ProtectedRoute>\n        <Wallet />\n      </ProtectedRoute>\n    }\n  />\n\n  <Route\n    path="/h2h"\n    element={\n      <ProtectedRoute>\n        <H2HMatches />\n      </ProtectedRoute>\n    }\n  />\n\n  <Route\n    path="/h2h/:id"\n    element={\n      <ProtectedRoute>\n        <H2HMatchDetail />\n      </ProtectedRoute>\n    }\n  />\n`);
app = insertAfter(app, '  <Route path="users" element={<AdminUsers />} />', '  <Route path="h2h-review" element={<AdminH2HReview />} />\n  <Route path="economy" element={<AdminEconomy />} />');
write('frontend/src/App.jsx', app);

// Navbar.jsx: add public/auth links in the top links array.
let nav = read('frontend/src/components/Navbar.jsx');
if (!nav.includes("{ to: '/h2h', label: 'رو-در-رو' }")) {
  nav = nav.replace("{ to: '/tournaments', label: 'مسابقات' },", "{ to: '/tournaments', label: 'مسابقات' },\n { to: '/h2h', label: 'رو-در-رو' },\n { to: '/wallet', label: 'کیف پول' },");
}
write('frontend/src/components/Navbar.jsx', nav);

// AdminLayout.jsx: add admin sidebar links.
let adminLayout = read('frontend/src/pages/admin/AdminLayout.jsx');
if (!adminLayout.includes('Scale')) {
  adminLayout = adminLayout.replace("import { LayoutDashboard, Trophy, Swords, Newspaper, Users } from 'lucide-react';", "import { LayoutDashboard, Trophy, Swords, Newspaper, Users, Scale, WalletCards } from 'lucide-react';");
}
if (!adminLayout.includes("{ to: '/admin/h2h-review'")) {
  adminLayout = adminLayout.replace("{ to: '/admin/users', label: 'کاربران', icon: Users },", "{ to: '/admin/users', label: 'کاربران', icon: Users },\n { to: '/admin/h2h-review', label: 'داوری رو-در-رو', icon: Scale },\n { to: '/admin/economy', label: 'اقتصاد و گریدها', icon: WalletCards },");
}
write('frontend/src/pages/admin/AdminLayout.jsx', adminLayout);

console.log('Frontend H2H patch applied successfully.');
