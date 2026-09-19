import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const dietaryOptions = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export default function FoodFinder({ partyLocation }) {
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDietChange = (dietId) => {
    setSelectedDiets(prev =>
      prev.includes(dietId)
        ? prev.filter(d => d !== dietId)
        : [...prev, dietId]
    );
  };

  const findFood = async () => {
    setLoading(true);
    setResults([]);
    try {
      const prompt = `
        Find 5 top-rated restaurants near "${partyLocation.name}, ${partyLocation.address}" that cater to the following dietary needs: ${selectedDiets.join(', ') || 'any'}.
        Sort the results by the highest review rating first.
        For each restaurant, provide its name, a short description, its star rating, a price level (e.g., $, $$, $$$), and its address.
      `;
      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            restaurants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  rating: { type: "number" },
                  price_level: { type: "string" },
                  address: { type: "string" },
                },
                required: ["name", "description", "rating", "price_level", "address"],
              },
            },
          },
        },
      });
      setResults(response.restaurants || []);
    } catch (error) {
      console.error("Error finding food:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          Food Nearby
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Dietary Preferences</h4>
          <div className="flex flex-wrap gap-4">
            {dietaryOptions.map(diet => (
              <div key={diet.id} className="flex items-center space-x-2">
                <Checkbox
                  id={diet.id}
                  checked={selectedDiets.includes(diet.id)}
                  onCheckedChange={() => handleDietChange(diet.id)}
                />
                <label htmlFor={diet.id} className="text-sm font-medium leading-none">
                  {diet.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={findFood} disabled={loading} className="w-full gap-2">
          <Sparkles className="w-4 h-4" />
          {loading ? 'Searching...' : 'Find Restaurants'}
        </Button>

        {loading && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-gray-800">Top Recommendations:</h3>
            {results.map((res, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-bold text-gray-900">{res.name}</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <Badge variant="secondary">⭐ {res.rating || 'N/A'}</Badge>
                  <Badge variant="secondary">{res.price_level || ''}</Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{res.description}</p>
                <p className="text-xs text-gray-500 mt-2">{res.address}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}