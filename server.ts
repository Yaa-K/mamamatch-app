import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock Nurse Data
  const nurses = [
    {
      id: '1',
      name: 'Nurse Grace Mensah',
      region: 'Accra Region',
      languages: ['English', 'Twi'],
      role: 'Midwife',
      experience: '8yr Exp',
      available: true,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxhN5ZrcAQ0If5m7xFCI9R2OF_i_Gg4xJ5KFX15WHblQqwDi4xpTDfI3sGi9PEJeCGxdmBhzzx-baJZk2TSPK7lSJTlJVnUcGW2OjEwaBvAD8tyMcpsE2KZJMIYNCaMu2M0ykwsMVaYaVqnKTaRLu7LEX9Ph9A5bxdXWvNLAFifVLskYsAPGL4BMDbGtf18okTtZHSVyJgThjSYI2vCZsEno51Hm4LOOSMSHUzyR8Guc12kTbXcsFZ2wdByFdof9ctX52mvgaZ2T-3'
    },
    {
      id: '2',
      name: 'Nurse Abena Osei',
      region: 'Kumasi Region',
      languages: ['English', 'Twi'],
      role: 'Maternal Nurse',
      experience: '5yr Exp',
      available: true,
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2574&auto=format&fit=crop'
    },
    {
       id: '3',
       name: 'Nurse Naa Lamley',
       region: 'Greater Accra',
       languages: ['English', 'Ga'],
       role: 'Midwife',
       experience: '12yr Exp',
       available: false,
       avatar: 'https://images.unsplash.com/photo-1559839734-2b71f1e3c77c?q=80&w=2670&auto=format&fit=crop'
    }
  ];

  app.get('/api/nurses', (req, res) => {
    const { region, language } = req.query;
    let filtered = [...nurses];
    if (region) {
      filtered = filtered.filter(n => n.region.toLowerCase().includes(region.toString().toLowerCase()));
    }
    if (language) {
      filtered = filtered.filter(n => n.languages.includes(language as string));
    }
    res.json(filtered);
  });

  // Mock Cluster Data for Dashboard
  app.get('/api/risk-clusters', (req, res) => {
    res.json([
      { region: 'Greater Accra', highRiskCount: 45, medRiskCount: 120, lowRiskCount: 300 },
      { region: 'Ashanti', highRiskCount: 62, medRiskCount: 150, lowRiskCount: 280 },
      { region: 'Western', highRiskCount: 18, medRiskCount: 80, lowRiskCount: 210 },
      { region: 'Northern', highRiskCount: 35, medRiskCount: 95, lowRiskCount: 180 },
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
