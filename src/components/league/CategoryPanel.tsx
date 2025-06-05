import React, { useState, useEffect } from 'react';
import { useLeague, Category, Zone } from '../../contexts/LeagueContext';
import { zonesService } from '../../services/zonesService';
import { cn } from '../../utils/cn';

interface CategoryPanelProps {
  category: Category;
  isSelected: boolean;
  onSelect: (categoryId: string, zoneId: string) => void;
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({ 
  category, 
  isSelected, 
  onSelect 
}) => {
  const { getLeague } = useLeague();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(isSelected);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  
  const league = getLeague(category.leagueId);

  // Cargar zonas cuando se expande la categoría
  useEffect(() => {
    if (expanded) {
      loadZones();
    }
  }, [expanded, category.id]);

  const loadZones = async () => {
    try {
      setLoading(true);
      const categoryZones = await zonesService.getZonesByCategory(category.id);
      setZones(categoryZones);
      
      // Set the first zone as active if none is selected and zones exist
      if (!activeZoneId && categoryZones.length > 0) {
        setActiveZoneId(categoryZones[0].id);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update expanded state based on isSelected prop
  useEffect(() => {
    setExpanded(isSelected);
  }, [isSelected]);
  
  const handleCategoryClick = () => {
    setExpanded(!expanded);
    if (!expanded && activeZoneId) {
      onSelect(category.id, activeZoneId);
    }
  };
  
  const handleZoneClick = (zoneId: string) => {
    setActiveZoneId(zoneId);
    onSelect(category.id, zoneId);
  };
  
  return (
    <div 
      className={cn(
        "league-panel",
        isSelected && "ring-2 ring-primary-500"
      )}
    >
      <button
        className="w-full flex items-center justify-between font-semibold text-lg p-2 rounded-md hover:bg-gray-50 transition-colors"
        onClick={handleCategoryClick}
      >
        <span>{category.name}</span>
        <span className="text-gray-400">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-500 uppercase">Zonas</h4>
          <div className="space-y-1">
            {loading ? (
              <div className="text-center py-2 text-gray-500">
                Cargando zonas...
              </div>
            ) : zones.length > 0 ? (
              zones.map((zone: Zone) => (
                <button
                  key={zone.id}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    activeZoneId === zone.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => handleZoneClick(zone.id)}
                >
                  {zone.name}
                </button>
              ))
            ) : (
              <div className="text-center py-2 text-gray-500 text-sm">
                No hay zonas disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPanel;