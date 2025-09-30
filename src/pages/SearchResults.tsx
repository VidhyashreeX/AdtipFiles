import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Video, 
  Play, 
  Film, 
  MessageSquare, 
  Eye, 
  Heart, 
  Share2, 
  User, 
  Calendar,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { searchService } from '@/services/searchService';

interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'short' | 'post' | 'user' | 'channel';
  description?: string;
  thumbnail?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string;
  channelName?: string;
  channelProfile?: string;
  userName?: string;
  userProfile?: string;
  isPaid?: boolean;
  earnings?: number;
}

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'all' | 'videos' | 'shorts' | 'posts' | 'users' | 'channels'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchService.globalSearch(searchQuery, {
        type: searchType,
        limit: 50,
        offset: 0
      });

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'short': return <Film className="w-4 h-4" />;
      case 'post': return <MessageSquare className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'channel': return <Video className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const renderContentCard = (item: SearchResult, index: number) => (
    <Card key={`${item.id}-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-adtip-teal to-adtip-teal/80 flex items-center justify-center text-white">
              {getContentIcon(item.type)}
            </div>
          )}
          
          {item.isPaid && (
            <Badge className="absolute top-2 right-2 bg-adtip-teal/10 text-adtip-teal border-adtip-teal/20">
              Paid
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {getContentIcon(item.type)}
            <Badge variant="outline" className="text-xs">
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
          </div>
          
          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</h3>
          
          {item.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(item.views || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatNumber(item.likes || 0)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {formatNumber(item.comments || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {formatNumber(item.shares || 0)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.channelProfile && (
                <img
                  src={item.channelProfile}
                  alt="Channel"
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="text-xs text-gray-600">
                {item.channelName || item.userName || 'Unknown'}
              </span>
            </div>
            
            {item.earnings && item.earnings > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Earnings</p>
                <p className="text-sm font-semibold text-adtip-teal">
                  ₹{item.earnings.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          {item.createdAt && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const filteredResults = results.filter(item => {
    if (searchType === 'all') return true;
    
    // Map search type to content type
    const typeMap: Record<string, SearchResult['type']> = {
      'videos': 'video',
      'shorts': 'short',
      'posts': 'post',
      'users': 'user',
      'channels': 'channel'
    };
    
    return item.type === typeMap[searchType];
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for videos, shorts, posts, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="bg-adtip-teal hover:bg-adtip-teal/90">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                  <SelectItem value="shorts">Shorts</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="channels">Channels</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {loading ? 'Searching...' : `${filteredResults.length} results found`}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adtip-teal"></div>
            <span className="ml-2">Searching...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={performSearch} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-black mb-2">No results found</h3>
            <p className="text-gray-500">Try different keywords or search terms</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredResults.map((item, index) => renderContentCard(item, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
