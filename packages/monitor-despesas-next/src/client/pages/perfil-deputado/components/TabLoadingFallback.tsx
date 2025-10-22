
import { Card, CardContent } from '@/components/ui/card';

export function TabLoadingFallback() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando componente...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
