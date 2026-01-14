import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus, Save } from 'lucide-react';
import api from '../../lib/axios';
import Swal from 'sweetalert2';

const CategoryManagerModal = ({ isOpen, onClose, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const fetchCategories = async () => {
        try {
            const response = await api.get('/expense-categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        try {
            await api.post('/expense-categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
            onUpdate(); // generic callback to refresh parent
        } catch {
            Swal.fire('Error', 'Failed to add category', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                await api.delete(`/expense-categories/${id}`);
                fetchCategories();
                onUpdate();
            }
        } catch {
            Swal.fire('Error', 'Failed to delete category', 'error');
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat._id);
        setEditValue(cat.name);
    };

    const saveEdit = async (id) => {
        if (!editValue.trim()) return;
        try {
            await api.put(`/expense-categories/${id}`, { name: editValue });
            setEditingId(null);
            fetchCategories();
            onUpdate();
        } catch {
            Swal.fire('Error', 'Failed to update category', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Add/Manage Category</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Add New Section */}
                <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="New Category Name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                         <button 
                            onClick={handleAdd}
                            className="px-4 py-2 bg-white border border-dashed border-indigo-300 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add 
                        </button>
                     </div>
                </div>

                {/* List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {categories.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">No categories found. Add one above!</div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow group">
                                {editingId === cat._id ? (
                                    <div className="flex-1 flex gap-2 mr-2">
                                        <input 
                                             value={editValue}
                                             onChange={(e) => setEditValue(e.target.value)}
                                             className="flex-1 px-2 py-1 border border-indigo-200 rounded text-sm focus:outline-none"
                                             autoFocus
                                        />
                                        <button onClick={() => saveEdit(cat._id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                            <Save size={16} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="font-medium text-gray-700 text-sm pl-1">{cat.name}</span>
                                )}

                                {editingId !== cat._id && (
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEdit(cat)} 
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(cat._id)} 
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default CategoryManagerModal;
