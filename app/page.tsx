'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type SortField = 'sort_order' | 'text_value' | 'folder_path';

export default function App() {
  const [session, setSession] = useState<any>(null);
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard States
  const [patterns, setPatterns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Sorting States (အသစ်ထည့်ထားသော State များ)
  const [sortBy, setSortBy] = useState<SortField>('sort_order');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Form States
  const [categoryId, setCategoryId] = useState('');
  const [textValue, setTextValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchPatterns();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Login Failed: ' + error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('pattern_categories').select('*');
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const fetchPatterns = async () => {
    setDataLoading(true);
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .order('sort_order', { ascending: true }); // Database ကနေ Default အနေနဲ့ Sort Order အတိုင်းခေါ်ပါမယ်

    if (error) console.error('Error fetching patterns:', error);
    else setPatterns(data || []);
    setDataLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { 
      category_id: categoryId, 
      text_value: textValue, 
      image_url: imageUrl, 
      folder_path: folderPath, 
      sort_order: sortOrder 
    };

    if (editingId) {
      const { error } = await supabase.from('patterns').update(payload).eq('id', editingId);
      if (error) alert('Error updating: ' + error.message);
      else alert('Updated successfully!');
    } else {
      const { error } = await supabase.from('patterns').insert([payload]);
      if (error) alert('Error saving: ' + error.message);
      else alert('Added successfully!');
    }
    
    fetchPatterns();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pattern?")) return;
    const { error } = await supabase.from('patterns').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else { alert('Deleted successfully!'); fetchPatterns(); }
  };

  const handleEdit = (pattern: any) => {
    setEditingId(pattern.id);
    setCategoryId(pattern.category_id || '');
    setTextValue(pattern.text_value || '');
    setImageUrl(pattern.image_url || '');
    setFolderPath(pattern.folder_path || '');
    setSortOrder(pattern.sort_order || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setCategoryId(''); 
    setTextValue(''); 
    setImageUrl(''); 
    setFolderPath(''); 
    setSortOrder(0); 
    setEditingId(null);
  };

  // Header နှိပ်တဲ့အခါ အလုပ်လုပ်မယ့် Function (အသစ်)
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc); // တူညီတဲ့ ခေါင်းစဉ်ကို ထပ်နှိပ်ရင် အတက်/အဆင်း ပြောင်းမယ်
    } else {
      setSortBy(field);
      setSortAsc(true); // ခေါင်းစဉ်အသစ်ဆိုရင် A-Z (Ascending) ကစမယ်
    }
  };

  // ဇယားထဲပြမယ့် Data များကို အစဉ်လိုက်စီခြင်း (အသစ်)
  const sortedPatterns = [...patterns].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // စာသားဆိုရင် အကြီးအသေး မရွေးဘဲ စီနိုင်ရန်
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    // အလွတ်ဖြစ်နေရင် နောက်ဆုံးပို့ရန်
    if (!valA && valB) return sortAsc ? 1 : -1;
    if (valA && !valB) return sortAsc ? -1 : 1;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const existingFolderPaths = Array.from(new Set(patterns.map(p => p.folder_path).filter(Boolean)));

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-black font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@example.com" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50">
            {authLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Chart Patterns Admin</h1>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded border border-red-200 transition">
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">{editingId ? 'Edit Pattern' : 'Add New Pattern'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              required 
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
            >
              <option value="" disabled>Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.category_name || c.title || c.id}
                </option>
              ))}
            </select>

            <input type="text" placeholder="Text Value" value={textValue} onChange={(e) => setTextValue(e.target.value)} required className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            
            <input 
              type="text" 
              placeholder="Folder Path (e.g. sl_2)" 
              value={folderPath} 
              onChange={(e) => setFolderPath(e.target.value)} 
              list="existing-folders" 
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" 
            />
            <datalist id="existing-folders">
              {existingFolderPaths.map((path, idx) => (
                <option key={idx} value={path as string} />
              ))}
            </datalist>

            <input type="number" placeholder="Sort Order" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
          </div>
          
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded transition">
              {editingId ? 'Update Record' : 'Save Record'}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded border transition">
              {editingId ? 'Cancel Edit' : 'Clear Form'}
            </button>
          </div>
        </form>

        {dataLoading ? (
          <div className="text-center py-10 text-gray-500">Loading data...</div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider select-none">
                  {/* ခေါင်းစဉ်များကို Click နှိပ်လို့ရအောင် ပြင်ထားပါသည် */}
                  <th className="p-4 border-b cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('sort_order')}>
                    Sort {sortBy === 'sort_order' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th className="p-4 border-b cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('text_value')}>
                    Text Value {sortBy === 'text_value' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th className="p-4 border-b cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('folder_path')}>
                    Folder Path {sortBy === 'folder_path' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th className="p-4 border-b">Image URL</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-sm">
                {/* ပြင်ထားတဲ့ sortedPatterns ကို အသုံးပြုပါမည် */}
                {sortedPatterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">{pattern.sort_order}</td>
                    <td className="p-4 font-medium">{pattern.text_value}</td>
                    <td className="p-4 text-gray-500">{pattern.folder_path}</td>
                    <td className="p-4 truncate max-w-[200px] text-gray-500">{pattern.image_url}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(pattern)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(pattern.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
