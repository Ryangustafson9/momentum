import React from 'react';
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveCard 
} from './ResponsiveContainer';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Demo component showing responsive layout capabilities
 * This can be used to test and demonstrate the responsive system
 */
export const ResponsiveDemo = () => {
  const layout = useResponsiveLayout();

  return (
    <ResponsiveContainer className="space-y-6">
      {/* Layout Information Card */}
      <ResponsiveCard>
        <CardHeader>
          <CardTitle>Responsive Layout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Breakpoint:</strong>
              <div className="text-blue-600 font-mono">{layout.breakpoint}</div>
            </div>
            <div>
              <strong>Device Type:</strong>
              <div className="text-green-600 font-mono">{layout.layoutMode}</div>
            </div>
            <div>
              <strong>Viewport:</strong>
              <div className="text-purple-600 font-mono">
                {layout.width} × {layout.height}
              </div>
            </div>
            <div>
              <strong>Sidebar:</strong>
              <div className="text-orange-600 font-mono">
                {layout.sidebarCollapsed ? 'Collapsed' : 'Expanded'}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs ${layout.isMobile ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              Mobile: {layout.isMobile ? 'Yes' : 'No'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${layout.isTablet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              Tablet: {layout.isTablet ? 'Yes' : 'No'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${layout.isDesktop ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
              Desktop: {layout.isDesktop ? 'Yes' : 'No'}
            </span>
          </div>
        </CardContent>
      </ResponsiveCard>

      {/* Responsive Grid Demo */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Responsive Grid Demo</h3>
        <ResponsiveGrid cols="auto" spacing="normal">
          {Array.from({ length: 8 }, (_, i) => (
            <ResponsiveCard key={i} padding="normal">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-3"></div>
                <h4 className="font-medium">Card {i + 1}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  This card automatically adjusts to the viewport size
                </p>
              </div>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      </div>

      {/* Responsive Utilities Demo */}
      <ResponsiveCard>
        <CardHeader>
          <CardTitle>Responsive Utilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Container Padding:</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                {layout.getContainerPadding()}
              </code>
            </div>
            
            <div>
              <strong>Grid Columns (default 4):</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                {layout.getGridCols(4)}
              </code>
            </div>
            
            <div>
              <strong>Sidebar Width:</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                {layout.getSidebarWidth()}
              </code>
            </div>
            
            <div>
              <strong>Main Content Class:</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                {layout.getMainContentClass()}
              </code>
            </div>
          </div>
        </CardContent>
      </ResponsiveCard>

      {/* Responsive Behavior Demo */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Responsive Behavior Demo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900">Mobile First</h4>
              <p className="text-sm text-blue-700 mt-2">
                This layout starts with mobile design and scales up
              </p>
              <div className="mt-3">
                <div className="block sm:hidden text-xs text-blue-600">📱 Mobile View</div>
                <div className="hidden sm:block md:hidden text-xs text-blue-600">📱 Small View</div>
                <div className="hidden md:block lg:hidden text-xs text-blue-600">💻 Medium View</div>
                <div className="hidden lg:block text-xs text-blue-600">🖥️ Large View</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-900">Auto Adjusting</h4>
              <p className="text-sm text-green-700 mt-2">
                Components automatically adjust spacing and layout
              </p>
              <div className="mt-3 space-y-1">
                <div className={`h-2 rounded ${layout.isMobile ? 'bg-green-400 w-full' : 'bg-green-300 w-3/4'}`}></div>
                <div className={`h-2 rounded ${layout.isTablet ? 'bg-green-400 w-5/6' : 'bg-green-300 w-1/2'}`}></div>
                <div className={`h-2 rounded ${layout.isDesktop ? 'bg-green-400 w-full' : 'bg-green-300 w-2/3'}`}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-purple-900">Real-time Updates</h4>
              <p className="text-sm text-purple-700 mt-2">
                Layout updates immediately when window is resized
              </p>
              <div className="mt-3">
                <div className="text-xs text-purple-600">
                  Current: {layout.width}px × {layout.height}px
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Breakpoint: {layout.breakpoint}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <ResponsiveCard>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>🔄 <strong>Resize your browser window</strong> to see the layout adapt in real-time</p>
            <p>📱 <strong>Open developer console</strong> to test viewport changes</p>
            <p>🔧 <strong>Toggle sidebar</strong> to see content area adjustments</p>
            <p>📐 <strong>Try different screen sizes:</strong></p>
            <ul className="ml-4 space-y-1 text-xs text-gray-600">
              <li>• Mobile: &lt; 768px</li>
              <li>• Tablet: 768px - 1024px</li>
              <li>• Desktop: &gt; 1024px</li>
            </ul>
          </div>
        </CardContent>
      </ResponsiveCard>
    </ResponsiveContainer>
  );
};

export default ResponsiveDemo;
