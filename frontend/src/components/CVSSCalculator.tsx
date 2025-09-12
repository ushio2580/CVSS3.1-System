import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Shield } from 'lucide-react';

interface CVSSMetrics {
  AV: string;
  AC: string;
  PR: string;
  UI: string;
  S: string;
  C: string;
  I: string;
  A: string;
}

interface CVSSResult {
  baseScore: number;
  severity: string;
  vector: string;
}

const BASE_METRICS = {
  AV: ['Network', 'Adjacent', 'Local', 'Physical'],
  AC: ['Low', 'High'],
  PR: ['None', 'Low', 'High'],
  UI: ['None', 'Required'],
  S: ['Unchanged', 'Changed'],
  C: ['None', 'Low', 'High'],
  I: ['None', 'Low', 'High'],
  A: ['None', 'Low', 'High']
};

const IMPACT_WEIGHTS = {
  C: { None: 0, Low: 0.22, High: 0.56 },
  I: { None: 0, Low: 0.22, High: 0.56 },
  A: { None: 0, Low: 0.22, High: 0.56 }
};

const EXPLOITABILITY_WEIGHTS = {
  AV: { Network: 0.85, Adjacent: 0.62, Local: 0.55, Physical: 0.2 },
  AC: { Low: 0.77, High: 0.44 },
  PR: { None: 0.85, Low: 0.62, High: 0.27 },
  UI: { None: 0.85, Required: 0.62 }
};

export const CVSSCalculator: React.FC = () => {
  const [metrics, setMetrics] = useState<CVSSMetrics>({
    AV: 'Network',
    AC: 'Low',
    PR: 'None',
    UI: 'None',
    S: 'Unchanged',
    C: 'High',
    I: 'High',
    A: 'High'
  });

  const [result, setResult] = useState<CVSSResult | null>(null);

  const calculateBaseScore = (metrics: CVSSMetrics): CVSSResult => {
    // Calculate Impact Subscore
    const impact = 1 - ((1 - IMPACT_WEIGHTS.C[metrics.C as keyof typeof IMPACT_WEIGHTS.C]) * 
                        (1 - IMPACT_WEIGHTS.I[metrics.I as keyof typeof IMPACT_WEIGHTS.I]) * 
                        (1 - IMPACT_WEIGHTS.A[metrics.A as keyof typeof IMPACT_WEIGHTS.A]));

    // Calculate Exploitability Subscore
    const exploitability = 8.22 * 
                          EXPLOITABILITY_WEIGHTS.AV[metrics.AV as keyof typeof EXPLOITABILITY_WEIGHTS.AV] * 
                          EXPLOITABILITY_WEIGHTS.AC[metrics.AC as keyof typeof EXPLOITABILITY_WEIGHTS.AC] * 
                          EXPLOITABILITY_WEIGHTS.PR[metrics.PR as keyof typeof EXPLOITABILITY_WEIGHTS.PR] * 
                          EXPLOITABILITY_WEIGHTS.UI[metrics.UI as keyof typeof EXPLOITABILITY_WEIGHTS.UI];

    // Calculate Base Score
    let baseScore = 0;
    if (impact <= 0) {
      baseScore = 0;
    } else if (metrics.S === 'Unchanged') {
      baseScore = Math.min(10, Math.round((impact + exploitability) * 10) / 10);
    } else {
      baseScore = Math.min(10, Math.round((impact + exploitability) * 1.08 * 10) / 10);
    }

    // Determine Severity
    let severity = '';
    if (baseScore >= 9.0) severity = 'Critical';
    else if (baseScore >= 7.0) severity = 'High';
    else if (baseScore >= 4.0) severity = 'Medium';
    else if (baseScore >= 0.1) severity = 'Low';
    else severity = 'None';

    // Generate Vector
    const vector = `CVSS:3.1/AV:${metrics.AV.charAt(0)}/AC:${metrics.AC.charAt(0)}/PR:${metrics.PR.charAt(0)}/UI:${metrics.UI.charAt(0)}/S:${metrics.S.charAt(0)}/C:${metrics.C.charAt(0)}/I:${metrics.I.charAt(0)}/A:${metrics.A.charAt(0)}`;

    return { baseScore, severity, vector };
  };

  const handleCalculate = () => {
    const result = calculateBaseScore(metrics);
    setResult(result);
  };

  const handleMetricChange = (metric: keyof CVSSMetrics, value: string) => {
    setMetrics(prev => ({ ...prev, [metric]: value }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            CVSS Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(BASE_METRICS).map(([metric, options]) => (
              <div key={metric} className="space-y-2">
                <label className="text-sm font-medium">{metric}</label>
                <select
                  value={metrics[metric as keyof CVSSMetrics]}
                  onChange={(e) => handleMetricChange(metric as keyof CVSSMetrics, e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Calculate Button */}
          <Button onClick={handleCalculate} className="w-full">
            Calculate CVSS Score
          </Button>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 p-4 border rounded-lg bg-card/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">Base Score:</span>
                </div>
                <div className="text-2xl font-bold">{result.baseScore}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Severity:</span>
                <Badge className={getSeverityColor(result.severity)}>
                  {result.severity}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <span className="text-sm font-medium">Vector:</span>
                <code className="block text-xs bg-muted p-2 rounded break-all">
                  {result.vector}
                </code>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
