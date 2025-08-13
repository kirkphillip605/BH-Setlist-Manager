import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, Music } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { songCollectionsService } from '../services/songCollectionsService';

const ManageSongCollections = () => {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setPageTitle('Song Collections');
    fetchCollections();
  }, [setPageTitle]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songCollectionsService.getAllSongCollections();
      setCollections(data);
    } catch (err) {
      console.error('Error fetching song collections:', err);
      setError(err.message || 'Failed to fetch song collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this song collection?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await songCollectionsService.deleteSongCollection(collectionId);
      await fetchCollections();
    } catch (err) {
      console.error('Error deleting song collection:', err);
      setError(err.message || 'Failed to delete song collection. Please try again.');
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

  const filteredCollections = useMemo(() => {
    return collections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collections, searchTerm]);

  const sortedCollections = useMemo(() => {
    if (!sortColumn) return filteredCollections;
    return [...filteredCollections].sort((a, b) => {
      const aValue = a[sortColumn] || '';
      const bValue = b[sortColumn] || '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCollections, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedCollections.length / itemsPerPage);
  const currentCollections = sortedCollections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center">
            <Music className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Song Collections</h1>
            <p className="text-zinc-400">Organize and curate your songs</p>
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
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern"
            />
          </div>
          <button
            onClick={() => navigate('/song-collections/add')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all btn-animate shadow-lg font-medium"
          >
            <PlusCircle size={20} className="mr-2" />
            New Collection
          </button>
        </div>

        {loading && <p className="text-center text-zinc-300 py-8">Loading song collections...</p>}

        {!loading && collections.length === 0 && !error && (
          <div className="text-center py-12">
            <Music className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <p className="text-zinc-300 text-lg mb-2">No song collections found</p>
            <p className="text-zinc-400 mb-6">Create your first song collection to get started</p>
            <button
              onClick={() => navigate('/song-collections/add')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all btn-animate font-medium"
            >
              <PlusCircle size={20} className="mr-2" />
              Create Collection
            </button>
          </div>
        )}

        {!loading && collections.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-700">
                <thead className="bg-zinc-800">
                  <tr>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Collection Name {renderSortIcon('name')}
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
                  {currentCollections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-zinc-700 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => navigate(`/song-collections/${collection.id}`)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors text-left"
                        >
                          {collection.name}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-zinc-300">
                        {collection.is_public ? (
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
                        {new Date(collection.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/song-collections/edit/${collection.id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit Collection"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Collection"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {currentCollections.map((collection) => (
                <div key={collection.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/song-collections/${collection.id}`)}
                        className="text-lg font-semibold text-blue-400 hover:text-blue-300 transition-colors text-left block mb-2 truncate w-full"
                      >
                        {collection.name}
                      </button>
                      <div className="flex items-center space-x-3 mb-2">
                        {collection.is_public ? (
                          <span className="badge badge-success">
                            Public
                          </span>
                        ) : (
                          <span className="badge badge-secondary">
                            Private
                          </span>
                        )}
                        <span className="text-sm text-zinc-400">
                          {new Date(collection.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/song-collections/edit/${collection.id}`)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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

export default ManageSongCollections;