import React from 'react';

const propertyTypes = [
  { id: 'retail', name: 'Retail', icon: '🏪' },
  { id: 'office', name: 'Office', icon: '🏢' },
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'condo', name: 'Condo (For Sale)', icon: '🏠' },
  { id: 'senior', name: 'Senior Living', icon: '🏥' },
  { id: 'mixed', name: 'Mixed Use', icon: '🏙️' }
];

export default function PropertyTypeSelector({ onSelect }) {
  const isAvailable = (typeId) => ['retail', 'office'].includes(typeId);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Pro Forma Builder</h1>
        <p className="text-xl text-gray-600 mb-8">Select your property type to get started</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {propertyTypes.map(type => (
            <button
              key={type.id}
              onClick={() => isAvailable(type.id) ? onSelect(type) : alert(`${type.name} coming soon!`)}
              className={`relative bg-white p-8 rounded-xl shadow-md transition-all ${
                isAvailable(type.id) 
                  ? 'hover:shadow-xl border-2 border-transparent hover:border-blue-500 cursor-pointer' 
                  : 'opacity-75 cursor-not-allowed'
              }`}
            >
              {!isAvailable(type.id) && (
                <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
              <div className="text-4xl mb-4">{type.icon}</div>
              <h3 className="text-xl font-semibold">{type.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}