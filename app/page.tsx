'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [textValue, setTextValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) console.error('Error fetching:', error);
    else setPatterns(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      text_value: textValue,
      image_url: imageUrl,
      folder_path: folderPath,
      sort_order: sortOrder,
    };

    if (editingId) {
      const { error } = await supabase.from('patterns').update(payload).eq('id', editingId);
      if (error) alert('Error: ' + error.message);
      else alert('Updated successfully!');
    } else {
      const { error } = await supabase.from('patterns').insert([payload]);
      if (error) alert('Error: ' + error.message);
      else alert('Added successfully!');
    }

    setTextValue('');
    setImageUrl('');
    setFolderPath('');
    setSortOrder(0);
    setEditingId(null);
    fetchPatterns();
  };

  const handleEdit = (pattern: any) => {
    setEditingId(pattern.id);
    setTextValue(pattern.text_value || '');
    setImageUrl(pattern.image_url || '');
    setFolderPath(pattern.folder_path || '');
    setSortOrder(pattern.sort_order || 0);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Chart Patterns Admin</h1>

      <form onSubmit={handleSubmit} className="mb-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {editingId ? 'Edit Pattern' : 'Add New Pattern'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Text Value (e.g., Bearish Pennant)"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Folder Path (e.g., cc/cc4)"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded transition">
            {editingId ? 'Update Record' : 'Save Record'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setTextValue(''); setImageUrl(''); setFolderPath(''); setSortOrder(0); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded transition border border-gray-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading data...</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 border-b">Sort</th>
                <th className="p-4 border-b">Text Value</th>
                <th className="p-4 border-b">Folder Path</th>
                <th className="p-4 border-b">Image URL</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-sm">
              {patterns.map((pattern) => (
                <tr key={pattern.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4">{pattern.sort_order}</td>
                  <td className="p-4 font-medium">{pattern.text_value}</td>
                  <td className="p-4 text-gray-500">{pattern.folder_path}</td>
                  <td className="p-4 truncate max-w-[200px] text-gray-500">{pattern.image_url}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(pattern)} className="text-blue-600 hover:text-blue-800 font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {patterns.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No patterns found. Add your first one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
