import { Card, CardContent, CardHeader } from '@/components/ui/card'

export const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

export const DashboardSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

export const PremiacoesSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((section) => (
      <Card key={section}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-1"></div>
                  <div className="w-full">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)