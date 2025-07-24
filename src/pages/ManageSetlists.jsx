import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, ListMusic, Printer } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { generateSetlistPDF } from '../utils/pdfGenerator';

const ManageSetlists = () => {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateFormData, setDuplicateFormData] = useState({
    sourceSetlistId: '',
    newName: '',
    isPublic: false
  });

  useEffect(() => {
    setPageTitle('Setlists');
    fetchSetlists();
  }, [setPageTitle]);

  const fetchSetlists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setlistsService.getAllSetlists();
      setSetlists(data);
    } catch (err) {
      console.error('Error fetching setlists:', err);
      setError(err.message || 'Failed to fetch setlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSetlist = async (setlistId) => {
    if (!window.confirm('Are you sure you want to delete this setlist?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setlistsService.deleteSetlist(setlistId);
      await fetchSetlists();
    } catch (err) {
      console.error('Error deleting setlist:', err);
      setError(err.message || 'Failed to delete setlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSetlist = async (setlist) => {
    try {
      await generateSetlistPDF(setlist);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const handleDuplicateSetlist = async (e) => {
    e.preventDefault();
    if (!duplicateFormData.sourceSetlistId || !duplicateFormData.newName.trim()) {
      setError('Please select a source setlist and enter a new name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await setlistsService.duplicateSetlist(
        duplicateFormData.sourceSetlistId,
        duplicateFormData.newName,
        user.id,
        duplicateFormData.isPublic
      );
      await fetchSetlists();
      setShowDuplicateForm(false);
      setDuplicateFormData({ sourceSetlistId: '', newName: '', isPublic: false });
    } catch (err) {
      console.error('Error duplicating setlist:', err);
      setError(err.message || 'Failed to duplicate setlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredSetlists = useMemo(() => {
    return setlists.filter(setlist =>
      setlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [setlists, searchTerm]);

  const sortedSetlists = useMemo(() => {
    if (!sortColumn) return filteredSetlists;
    return [...filteredSetlists].sort((a, b) => {
      const aValue = a[sortColumn] || '';
      const bValue = b[sortColumn] || '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSetlists, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedSetlists.length / itemsPerPage);
  const currentSetlists = sortedSetlists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <ListMusic className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Setlists</h1>
            <p className="text-zinc-400">Manage your performance setlists</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="card-modern p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="w-full sm:w-1/2 lg:w-1/3">
            <input
              type="text"
              placeholder="Search setlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern"
            />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => setShowDuplicateForm(!showDuplicateForm)}
              className="inline-flex items-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all btn-animate shadow-lg font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              {showDuplicateForm ? 'Cancel' : 'New (From Existing)'}
            </button>
            <button
              onClick={() => navigate('/setlists/add')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all btn-animate shadow-lg font-medium"
            >
              <PlusCircle size={20} className="mr-2" />
              New Setlist
            </button>
          </div>
        </div>

        {/* Duplicate Setlist Form */}
        {showDuplicateForm && (
          <div className="bg-zinc-800 rounded-xl p-4 lg:p-6 border border-zinc-700 mb-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Duplicate Existing Setlist</h3>
            <form onSubmit={handleDuplicateSetlist} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sourceSetlist" className="block text-sm font-medium text-zinc-300 mb-2">
                    Source Setlist
                  </label>
                  <select
                    id="sourceSetlist"
                    value={duplicateFormData.sourceSetlistId}
                    onChange={(e) => setDuplicateFormData(prev => ({ ...prev, sourceSetlistId: e.target.value }))}
                    className="input-modern"
                    required
                  >
                    <option value="">Choose a setlist to duplicate...</option>
                    {setlists.map((setlist) => (
                      <option key={setlist.id} value={setlist.id}>
                        {setlist.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="newName" className="block text-sm font-medium text-zinc-300 mb-2">
                    New Setlist Name
                  </label>
                  <input
                    type="text"
                    id="newName"
                    value={duplicateFormData.newName}
                    onChange={(e) => setDuplicateFormData(prev => ({ ...prev, newName: e.target.value }))}
                    className="input-modern"
                    placeholder="Enter new setlist name..."
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="duplicateIsPublic"
                  type="checkbox"
                  checked={duplicateFormData.isPublic}
                  onChange={(e) => setDuplicateFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-600 rounded bg-zinc-700"
                />
                <label htmlFor="duplicateIsPublic" className="ml-2 block text-sm text-zinc-300">
                  Make this setlist public (visible to all users)
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDuplicateForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  {loading ? 'Duplicating...' : 'Duplicate Setlist'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && <p className="text-center text-zinc-300 py-8">Loading setlists...</p>}

        {!loading && setlists.length === 0 && !error && (
          <div className="text-center py-12">
            <ListMusic className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <p className="text-zinc-300 text-lg mb-2">No setlists found</p>
            <p className="text-zinc-400 mb-6">Create your first setlist to get started</p>
            <button
              onClick={() => navigate('/setlists/add')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all btn-animate font-medium"
            >
              <PlusCircle size={20} className="mr-2" />
              Create Setlist
            </button>
          </div>
        )}

        {!loading && setlists.length > 0 && (
          <>
            <div className="bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-700">
                <thead className="bg-zinc-800">
                  <tr>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Setlist Name {renderSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Created {renderSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-800 divide-y divide-zinc-700">
                  {currentSetlists.map((setlist) => (
                    <tr key={setlist.id} className="hover:bg-zinc-700 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => navigate(`/setlists/${setlist.id}`)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors text-left"
                        >
                          {setlist.name}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-zinc-300">
                        {setlist.is_public ? (
                          <span className="badge badge-success">
                            Public
                          </span>
                        ) : (
                          <span className="badge badge-secondary">
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-zinc-300">
                        {new Date(setlist.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handlePrintSetlist(setlist)}
                            className="p-2 text-green-400 hover:text-green-300 transition-colors"
                            title="Print Setlist"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/setlists/edit/${setlist.id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit Setlist"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteSetlist(setlist.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Setlist"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <label htmlFor="items-per-page" className="text-sm text-slate-300">Items per page:</label>
                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="block w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <nav className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-zinc-300">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageSetlists;