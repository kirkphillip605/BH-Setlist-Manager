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
          <button
            onClick={() => navigate('/setlists/add')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all btn-animate shadow-lg font-medium"
          >
            <PlusCircle size={20} className="mr-2" />
            New Setlist
          </button>
        </div>

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