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
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'patterns' | 'categories'>('patterns');

  // Data States
  const [patterns, setPatterns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Sorting States (Patterns အတွက်)
  const [sortBy, setSortBy] = useState<SortField>('sort_order');
  const [sortAsc, setSortAsc] = useState(true);

  // --- Pattern Form States ---
  const [categoryId, setCategoryId] = useState('');
  const [textValue, setTextValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);

  // --- Category Form States ---
  const [catName, setCatName] = useState('');
  const [catIconName, setCatIconName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

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
    const { data, error } = await supabase.from('pattern_categories').select('*').order('created_at', { ascending: true });
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const fetchPatterns = async () => {
    setDataLoading(true);
    const { data, error } = await supabase.from('patterns').select('*').order('sort_order', { ascending: true });
    if (error) console.error('Error fetching patterns:', error);
    else setPatterns(data || []);
    setDataLoading(false);
  };

  // ================= PATTERN CRUD =================
  const handlePatternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { category_id: categoryId, text_value: textValue, image_url: imageUrl, folder_path: folderPath, sort_order: sortOrder };

    if (editingPatternId) {
      const { error } = await supabase.from('patterns').update(payload).eq('id', editingPatternId);
      if (error) alert('Error updating: ' + error.message);
      else alert('Updated successfully!');
    } else {
      const { error } = await supabase.from('patterns').insert([payload]);
      if (error) alert('Error saving: ' + error.message);
      else alert('Added successfully!');
    }
    fetchPatterns();
    resetPatternForm();
  };

  const handlePatternDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pattern?")) return;
    const { error } = await supabase.from('patterns').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else { alert('Deleted successfully!'); fetchPatterns(); }
  };

  const handlePatternEdit = (pattern: any) => {
    setEditingPatternId(pattern.id);
    setCategoryId(pattern.category_id || '');
    setTextValue(pattern.text_value || '');
    setImageUrl(pattern.image_url || '');
    setFolderPath(pattern.folder_path || '');
    setSortOrder(pattern.sort_order || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetPatternForm = () => {
    setCategoryId(''); setTextValue(''); setImageUrl(''); setFolderPath(''); setSortOrder(0); setEditingPatternId(null);
  };

  // ================= CATEGORY CRUD =================
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: catName, icon_name: catIconName };

    if (editingCatId) {
      const { error } = await supabase.from('pattern_categories').update(payload).eq('id', editingCatId);
      if (error) alert('Error updating category: ' + error.message);
      else alert('Category updated successfully!');
    } else {
      const { error } = await supabase.from('pattern_categories').insert([payload]);
      if (error) alert('Error saving category: ' + error.message);
      else alert('Category added successfully!');
    }
    fetchCategories();
    resetCategoryForm();
  };

  const handleCategoryDelete = async (id: string) => {
    if (!window.confirm("Are you sure? WARNING: If there are patterns linked to this category, deletion might fail.")) return;
    const { error } = await supabase.from('pattern_categories').delete().eq('id', id);
    if (error) alert('Error deleting category: ' + error.message);
    else { alert('Category deleted!'); fetchCategories(); }
  };

  const handleCategoryEdit = (cat: any) => {
    setEditingCatId(cat.id);
    setCatName(cat.name || '');
    setCatIconName(cat.icon_name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetCategoryForm = () => {
    setCatName(''); setCatIconName(''); setEditingCatId(null);
  };

  // ================= SORTING (Patterns) =================
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(true); }
  };

  const sortedPatterns = [...patterns].sort((a, b) => {
    let valA = a[sortBy]; let valB = b[sortBy];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (!valA && valB) return sortAsc ? 1 : -1;
    if (valA && !valB) return sortAsc ? -1 : 1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const existingFolderPaths = Array.from(new Set(patterns.map(p => p.folder_path).filter(Boolean)));

  // ================= RENDER =================
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-black font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Chart Patterns Admin</h1>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded border border-red-200 transition">Logout</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`py-2 px-6 font-medium text-lg border-b-2 transition-colors ${activeTab === 'patterns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('patterns')}
          >
            Manage Patterns
          </button>
          <button 
            className={`py-2 px-6 font-medium text-lg border-b-2 transition-colors ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('categories')}
          >
            Manage Categories
          </button>
        </div>

        {/* ================= PATTERNS TAB ================= */}
        {activeTab === 'patterns' && (
          <div>
            <form onSubmit={handlePatternSubmit} className="mb-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">{editingPatternId ? 'Edit Pattern' : 'Add New Pattern'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black">
                  <option value="" disabled>Select Category</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <input type="text" placeholder="Text Value" value={textValue} onChange={(e) => setTextValue(e.target.value)} required className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                <input type="text" placeholder="Folder Path (e.g. sl_2)" value={folderPath} onChange={(e) => setFolderPath(e.target.value)} list="existing-folders" className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                <datalist id="existing-folders">{existingFolderPaths.map((path, idx) => (<option key={idx} value={path as string} />))}</datalist>
                <input type="number" placeholder="Sort Order" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded">{editingPatternId ? 'Update Pattern' : 'Save Pattern'}</button>
                <button type="button" onClick={resetPatternForm} className="bg-gray-100 text-gray-700 px-5 py-2 rounded border">{editingPatternId ? 'Cancel' : 'Clear Form'}</button>
              </div>
            </form>

            {dataLoading ? (<div className="text-center py-10">Loading patterns...</div>) : (
              <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider select-none">
                      <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort('sort_order')}>Sort {sortBy === 'sort_order' && (sortAsc ? '▲' : '▼')}</th>
                      <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort('text_value')}>Text Value {sortBy === 'text_value' && (sortAsc ? '▲' : '▼')}</th>
                      <th className="p-4 border-b cursor-pointer hover:bg-gray-200" onClick={() => handleSort('folder_path')}>Folder Path {sortBy === 'folder_path' && (sortAsc ? '▲' : '▼')}</th>
                      <th className="p-4 border-b">Image URL</th>
                      <th className="p-4 border-b text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPatterns.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{p.sort_order}</td>
                        <td className="p-4 font-medium">{p.text_value}</td>
                        <td className="p-4 text-gray-500">{p.folder_path}</td>
                        <td className="p-4 truncate max-w-[200px] text-gray-500">{p.image_url}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handlePatternEdit(p)} className="text-blue-600 hover:underline mr-3">Edit</button>
                          <button onClick={() => handlePatternDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= CATEGORIES TAB ================= */}
        {activeTab === 'categories' && (
          <div>
            <form onSubmit={handleCategorySubmit} className="mb-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm max-w-2xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">{editingCatId ? 'Edit Category' : 'Add New Category'}</h2>
              <div className="flex flex-col gap-4 mb-4">
                <input type="text" placeholder="Category Name (e.g. My Entry)" value={catName} onChange={(e) => setCatName(e.target.value)} required className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                <input type="text" placeholder="Icon Name (e.g. forextrading)" value={catIconName} onChange={(e) => setCatIconName(e.target.value)} className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded">{editingCatId ? 'Update Category' : 'Save Category'}</button>
                <button type="button" onClick={resetCategoryForm} className="bg-gray-100 text-gray-700 px-5 py-2 rounded border">{editingCatId ? 'Cancel' : 'Clear Form'}</button>
              </div>
            </form>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 border-b">Category Name</th>
                    <th className="p-4 border-b">Icon Name</th>
                    <th className="p-4 border-b text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{cat.name}</td>
                      <td className="p-4 text-gray-500">{cat.icon_name}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleCategoryEdit(cat)} className="text-blue-600 hover:underline mr-3">Edit</button>
                        <button onClick={() => handleCategoryDelete(cat.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-500">No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
