import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

interface HeatmapSlot {
  slotNumber: number;
  productId: number | null;
  productName: string;
  usageCount: number;
  popularityScore: number;
  lastUsed: string;
  heatLevel: 'cold' | 'warm' | 'hot' | 'very-hot';
  product?: any;
}

interface HeatmapData {
  spraySlots: HeatmapSlot[];
  bottleSlots: HeatmapSlot[];
}

export default function HeatmapDisplay() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: heatmapData, isLoading, refetch } = useQuery<HeatmapData>({
    queryKey: ['/api/admin/heatmap'],
    refetchInterval: refreshInterval,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const getHeatColor = (heatLevel: string) => {
    switch (heatLevel) {
      case 'very-hot': return 'bg-red-500/80 border-red-400';
      case 'hot': return 'bg-orange-500/80 border-orange-400';
      case 'warm': return 'bg-yellow-500/80 border-yellow-400';
      case 'cold': return 'bg-blue-500/80 border-blue-400';
      default: return 'bg-gray-500/80 border-gray-400';
    }
  };

  const getHeatIntensity = (score: number) => {
    return Math.min(score, 100) / 100;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  const getMostPopularSlots = () => {
    if (!heatmapData) return [];
    
    const allSlots = [...heatmapData.spraySlots, ...heatmapData.bottleSlots];
    return allSlots
      .filter(slot => slot.productId)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5);
  };

  const getTrendingSlots = () => {
    if (!heatmapData) return [];
    
    const allSlots = [...heatmapData.spraySlots, ...heatmapData.bottleSlots];
    return allSlots
      .filter(slot => slot.productId && slot.usageCount > 50)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="mr-2 h-5 w-5 text-luxe-gold animate-pulse" />
            Real-time Inventory Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-luxe-gold border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-platinum">Loading heatmap data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-luxe-gold/50 mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Activity className="mr-2 h-5 w-5 text-luxe-gold" />
            Real-time Inventory Heatmap
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-luxe-gold border-luxe-gold">
              Live Updates
            </Badge>
            <button
              onClick={() => refetch()}
              className="text-luxe-gold hover:text-yellow-400 transition-colors"
            >
              <Activity className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/5 border-luxe-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-300">Most Popular</p>
                  <p className="text-white font-semibold">
                    {getMostPopularSlots()[0]?.productName || 'No data'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-luxe-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-300">Total Usage</p>
                  <p className="text-white font-semibold">
                    {heatmapData ? [...heatmapData.spraySlots, ...heatmapData.bottleSlots].reduce((sum, slot) => sum + slot.usageCount, 0) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-luxe-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-300">Active Slots</p>
                  <p className="text-white font-semibold">
                    {heatmapData ? [...heatmapData.spraySlots, ...heatmapData.bottleSlots].filter(slot => slot.productId).length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spray Slots Heatmap */}
        <div className="space-y-3">
          <h3 className="text-luxe-gold font-semibold">Spray Slots (1-5) - Popularity Heatmap</h3>
          <div className="grid grid-cols-5 gap-3">
            {heatmapData?.spraySlots.map((slot) => (
              <motion.div
                key={slot.slotNumber}
                className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${getHeatColor(slot.heatLevel)}`}
                style={{
                  boxShadow: `0 0 ${20 * getHeatIntensity(slot.popularityScore)}px rgba(255, 215, 0, ${0.3 * getHeatIntensity(slot.popularityScore)})`
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-center text-white">
                  <div className="text-xs font-bold mb-1">Slot {slot.slotNumber}</div>
                  {slot.product && (
                    <img
                      src={slot.product.imageUrl}
                      alt={slot.productName || 'Empty slot'}
                      className="w-8 h-8 object-cover rounded mx-auto mb-1"
                    />
                  )}
                  <div className="text-xs truncate">{slot.productName || 'Empty'}</div>
                  <div className="text-xs opacity-75">Uses: {slot.usageCount}</div>
                  <div className="text-xs opacity-75">{formatTimeAgo(slot.lastUsed)}</div>
                </div>
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {slot.popularityScore}%
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottle Slots Heatmap */}
        <div className="space-y-3">
          <h3 className="text-luxe-gold font-semibold">Bottle Slots (1-15) - Popularity Heatmap</h3>
          <div className="grid grid-cols-5 gap-2">
            {heatmapData?.bottleSlots.map((slot) => (
              <motion.div
                key={slot.slotNumber}
                className={`relative p-2 rounded-lg border transition-all duration-300 ${getHeatColor(slot.heatLevel)}`}
                style={{
                  boxShadow: `0 0 ${15 * getHeatIntensity(slot.popularityScore)}px rgba(255, 215, 0, ${0.2 * getHeatIntensity(slot.popularityScore)})`
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="text-center text-white">
                  <div className="text-xs font-bold mb-1">{slot.slotNumber}</div>
                  {slot.product && (
                    <img
                      src={slot.product.imageUrl}
                      alt={slot.productName || 'Empty slot'}
                      className="w-6 h-6 object-cover rounded mx-auto mb-1"
                    />
                  )}
                  <div className="text-xs truncate">{slot.productName?.slice(0, 8) || 'Empty'}</div>
                  <div className="text-xs opacity-75">{slot.usageCount}</div>
                </div>
                <div className="absolute top-0 right-0">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {slot.popularityScore}%
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Heat Legend */}
        <div className="flex items-center justify-center space-x-4 pt-4 border-t border-luxe-gold/30">
          <span className="text-sm text-gray-300">Heat Level:</span>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-xs text-gray-300">Cold</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-xs text-gray-300">Warm</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-xs text-gray-300">Hot</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-xs text-gray-300">Very Hot</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}