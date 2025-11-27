import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AISummaryCard({ 
  title = "AI Summary", 
  dataContext, 
  promptTemplate,
  className = ""
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: promptTemplate,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            keyMetrics: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  trend: { type: "string", enum: ["up", "down", "neutral"] }
                }
              } 
            },
            topTrends: { type: "array", items: { type: "string" } },
            anomalies: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      setSummary(result);
    } catch (error) {
      console.error("AI summary error:", error);
    }
    setLoading(false);
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-transparent ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> {title}
          </CardTitle>
          <Button onClick={generateSummary} disabled={loading} size="sm" variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {summary ? "Refresh" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-4">
            {/* Headline */}
            <p className="text-base font-medium text-gray-800">{summary.headline}</p>

            {/* Key Metrics */}
            {summary.keyMetrics?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {summary.keyMetrics.map((metric, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    {getTrendIcon(metric.trend)}
                    <span className="font-medium">{metric.label}:</span>
                    <span>{metric.value}</span>
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {/* Top Trends */}
              {summary.topTrends?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1 text-green-700">
                    <TrendingUp className="h-4 w-4" /> Top Trends
                  </h4>
                  <ul className="space-y-1">
                    {summary.topTrends.map((trend, idx) => (
                      <li key={idx} className="text-muted-foreground">• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Anomalies */}
              {summary.anomalies?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1 text-orange-700">
                    <AlertTriangle className="h-4 w-4" /> Anomalies
                  </h4>
                  <ul className="space-y-1">
                    {summary.anomalies.map((anomaly, idx) => (
                      <li key={idx} className="text-muted-foreground">• {anomaly}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {summary.recommendations?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1 text-blue-700">
                    <CheckCircle className="h-4 w-4" /> Actions
                  </h4>
                  <ul className="space-y-1">
                    {summary.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3 text-sm">
            Click "Generate" to get an AI-powered summary of key trends and insights
          </p>
        )}
      </CardContent>
    </Card>
  );
}