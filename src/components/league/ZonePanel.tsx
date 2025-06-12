import React, { useState, useEffect } from 'react';
import { useLeague, Zone, Category } from '../../contexts/LeagueContext';
import { cn } from '../../utils/cn';

interface ZonePanelProps {
  zone: Zone;
  isSelected: boolean;
  onSelect: (zoneId: string, categoryId: string) => void;
}

const ZonePanel: React.FC<ZonePanelProps> = ({ 
  zone, 
  isSelected, 
  onSelect 
}) => {
  const { getCategoriesByZone } = useLeague();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(isSelected);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar categorías cuando se expande la zona
  useEffect(() => {
    if (expanded) {
      loadCategories();
    }
  }, [expanded, zone.id]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const zoneCategories = getCategoriesByZone(zone.id);
      setCategories(zoneCategories);
      
      // Set the first category as active if none is selected and categories exist
      if (!activeCategoryId && zoneCategories.length > 0) {
        setActiveCategoryId(zoneCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update expanded state based on isSelected prop
  useEffect(() => {
    setExpanded(isSelected);
  }, [isSelected]);
  
  const handleZoneClick = () => {
    setExpanded(!expanded);
    if (!expanded && activeCategoryId) {
      onSelect(zone.id, activeCategoryId);
    }
  };
  
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    onSelect(zone.id, categoryId);
  };
  
  return (
    <div 
      className={cn(
        "league-panel",
        isSelected && "ring-2 ring-primary-500"
      )}
    >
      <button
        className="w-full flex items-center justify-between font-semibold text-base sm:text-lg p-3 sm:p-2 rounded-md hover:bg-gray-50 transition-colors touch-manipulation"
        onClick={handleZoneClick}
      >
        <span className="text-left">{zone.name}</span>
        <span className="text-gray-400 text-lg">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-gray-500 uppercase px-1">Categorías</h4>
          <div className="space-y-1">
            {loading ? (
              <div className="text-center py-3 text-gray-500 text-sm">
                Cargando categorías...
              </div>
            ) : categories.length > 0 ? (
              categories.map((category: Category) => (
                <button
                  key={category.id}
                  className={cn(
                    "w-full text-left px-3 py-3 sm:py-2 text-sm rounded-md transition-colors touch-manipulation",
                    activeCategoryId === category.id
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </button>
              ))
            ) : (
              <div className="text-center py-3 text-gray-500 text-sm">
                No hay categorías disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonePanel;