import React from 'react';
import { ResponsiveWrapper, ResponsiveGrid, ResponsiveCard, ResponsiveText, ResponsiveButton } from '@/components/ui/responsive-wrapper';
import { useResponsive, useResponsivePatterns } from '@/hooks/useResponsive';

export function ResponsiveExample() {
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useResponsive();
  const patterns = useResponsivePatterns();

  return (
    <ResponsiveWrapper container padding="lg">
      <div className="responsive-section">
        {/* Header */}
        <ResponsiveText as="h1" size="3xl" weight="bold" className="text-center responsive-margin">
          CVSS Scoring System
        </ResponsiveText>
        
        <ResponsiveText as="p" size="lg" className="text-center text-muted-foreground responsive-margin">
          Sistema de puntuación de vulnerabilidades responsive
        </ResponsiveText>

        {/* Current device info */}
        <ResponsiveCard className="responsive-margin">
          <ResponsiveText as="h2" size="xl" weight="semibold" className="responsive-margin">
            Información del dispositivo
          </ResponsiveText>
          <ResponsiveGrid cols={2} gap="md">
            <div>
              <ResponsiveText size="sm" className="text-muted-foreground">Breakpoint actual:</ResponsiveText>
              <ResponsiveText size="lg" weight="medium">{currentBreakpoint}</ResponsiveText>
            </div>
            <div>
              <ResponsiveText size="sm" className="text-muted-foreground">Tipo de dispositivo:</ResponsiveText>
              <ResponsiveText size="lg" weight="medium">
                {isMobile ? 'Móvil' : isTablet ? 'Tablet' : 'Desktop'}
              </ResponsiveText>
            </div>
          </ResponsiveGrid>
        </ResponsiveCard>

        {/* Dashboard Cards */}
        <ResponsiveGrid autoFit minWidth="300px" gap="lg" className="responsive-margin">
          <ResponsiveCard hover interactive>
            <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
              Vulnerabilidades
            </ResponsiveText>
            <ResponsiveText size="2xl" weight="bold" className="text-primary">
              1,234
            </ResponsiveText>
            <ResponsiveText size="sm" className="text-muted-foreground">
              Total de vulnerabilidades registradas
            </ResponsiveText>
          </ResponsiveCard>

          <ResponsiveCard hover interactive>
            <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
              Evaluaciones
            </ResponsiveText>
            <ResponsiveText size="2xl" weight="bold" className="text-primary">
              567
            </ResponsiveText>
            <ResponsiveText size="sm" className="text-muted-foreground">
              Evaluaciones CVSS completadas
            </ResponsiveText>
          </ResponsiveCard>

          <ResponsiveCard hover interactive>
            <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
              Usuarios
            </ResponsiveText>
            <ResponsiveText size="2xl" weight="bold" className="text-primary">
              89
            </ResponsiveText>
            <ResponsiveText size="sm" className="text-muted-foreground">
              Usuarios activos en el sistema
            </ResponsiveText>
          </ResponsiveCard>

          <ResponsiveCard hover interactive>
            <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
              Reportes
            </ResponsiveText>
            <ResponsiveText size="2xl" weight="bold" className="text-primary">
              234
            </ResponsiveText>
            <ResponsiveText size="sm" className="text-muted-foreground">
              Reportes generados este mes
            </ResponsiveText>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Responsive Actions */}
        <ResponsiveGrid cols={patterns.useMultiColumnLayout ? 3 : 1} gap="md" className="responsive-margin">
          <ResponsiveButton 
            variant="default" 
            size={patterns.useSmallText ? "sm" : "md"}
            fullWidth={patterns.useSingleColumnLayout}
          >
            Agregar Vulnerabilidad
          </ResponsiveButton>
          
          <ResponsiveButton 
            variant="outline" 
            size={patterns.useSmallText ? "sm" : "md"}
            fullWidth={patterns.useSingleColumnLayout}
          >
            Generar Reporte
          </ResponsiveButton>
          
          <ResponsiveButton 
            variant="ghost" 
            size={patterns.useSmallText ? "sm" : "md"}
            fullWidth={patterns.useSingleColumnLayout}
          >
            Ver Estadísticas
          </ResponsiveButton>
        </ResponsiveGrid>

        {/* Responsive Table Example */}
        <ResponsiveCard className="responsive-margin">
          <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
            Vulnerabilidades Recientes
          </ResponsiveText>
          
          <div className="responsive-data-table">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th className="text-left">Título</th>
                  {patterns.useTableLayout && <th className="text-left">CVE</th>}
                  {patterns.useTableLayout && <th className="text-left">Severidad</th>}
                  <th className="text-left">Estado</th>
                  <th className="text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>
                      <ResponsiveText size="sm" weight="medium">SQL Injection</ResponsiveText>
                      {patterns.useCardLayout && (
                        <ResponsiveText size="xs" className="text-muted-foreground">
                          CVE-2024-0001 • Crítica
                        </ResponsiveText>
                      )}
                    </div>
                  </td>
                  {patterns.useTableLayout && <td>CVE-2024-0001</td>}
                  {patterns.useTableLayout && <td>Crítica</td>}
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Abierta
                    </span>
                  </td>
                  <td>
                    <ResponsiveButton size="sm" variant="ghost">
                      Ver
                    </ResponsiveButton>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div>
                      <ResponsiveText size="sm" weight="medium">XSS Reflejado</ResponsiveText>
                      {patterns.useCardLayout && (
                        <ResponsiveText size="xs" className="text-muted-foreground">
                          CVE-2024-0002 • Media
                        </ResponsiveText>
                      )}
                    </div>
                  </td>
                  {patterns.useTableLayout && <td>CVE-2024-0002</td>}
                  {patterns.useTableLayout && <td>Media</td>}
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      En Mitigación
                    </span>
                  </td>
                  <td>
                    <ResponsiveButton size="sm" variant="ghost">
                      Ver
                    </ResponsiveButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ResponsiveCard>

        {/* Responsive Navigation Example */}
        <ResponsiveCard className="responsive-margin">
          <ResponsiveText as="h3" size="xl" weight="semibold" className="responsive-margin">
            Navegación Responsive
          </ResponsiveText>
          
          <nav className="responsive-nav">
            <ResponsiveButton variant="ghost" size="sm">
              Dashboard
            </ResponsiveButton>
            <ResponsiveButton variant="ghost" size="sm">
              Vulnerabilidades
            </ResponsiveButton>
            <ResponsiveButton variant="ghost" size="sm">
              Evaluaciones
            </ResponsiveButton>
            <ResponsiveButton variant="ghost" size="sm">
              Reportes
            </ResponsiveButton>
            {patterns.showHamburgerMenu && (
              <ResponsiveButton variant="outline" size="sm">
                ☰ Menú
              </ResponsiveButton>
            )}
          </nav>
        </ResponsiveCard>
      </div>
    </ResponsiveWrapper>
  );
}
