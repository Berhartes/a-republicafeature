"""
ETL Performance Testing Module

This module provides comprehensive performance testing for the enhanced ETL pipeline,
specifically focusing on the additional API calls for deputy details and their impact
on overall performance, rate limiting, and error handling.
"""

import time
import statistics
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich.progress import Progress, TaskID
from rich.panel import Panel

from ..sources.congresso_nacional.camara_deputados.client import CamaraApiClient
from ..sources.congresso_nacional.camara_deputados.processor import CamaraDataProcessor
from ..sources.congresso_nacional.camara_deputados.models import DeputadoApi


@dataclass
class PerformanceMetrics:
    """Performance metrics for ETL operations."""
    operation: str
    start_time: float
    end_time: float
    duration: float
    success: bool
    error_message: Optional[str] = None
    api_calls_count: int = 0
    data_processed: int = 0
    rate_limited: bool = False
    
    @property
    def duration_ms(self) -> float:
        """Duration in milliseconds."""
        return self.duration * 1000


@dataclass
class RateLimitingMetrics:
    """Rate limiting performance metrics."""
    total_requests: int
    rate_limited_requests: int
    average_wait_time: float
    max_wait_time: float
    min_wait_time: float
    rate_limit_percentage: float


@dataclass
class ErrorHandlingMetrics:
    """Error handling performance metrics."""
    total_operations: int
    successful_operations: int
    failed_operations: int
    timeout_errors: int
    network_errors: int
    api_errors: int
    success_rate: float


class ETLPerformanceTester:
    """Comprehensive ETL performance testing suite."""
    
    def __init__(self, output_dir: Optional[Path] = None):
        self.console = Console()
        default_output = Path("docs") / "performance" / "performance_reports"
        self.output_dir = output_dir or default_output
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Performance tracking
        self.metrics: List[PerformanceMetrics] = []
        self.rate_limiting_data: List[float] = []
        self.error_counts: Dict[str, int] = {
            'timeout': 0,
            'network': 0,
            'api': 0,
            'rate_limit': 0
        }
        
        # Test configuration
        self.test_legislatura = 57  # Current legislature
        self.test_deputy_limit = 10  # Limit for performance testing
        self.rate_limit_wait_times = [50, 100, 150, 200, 300]  # Different wait times to test
        
        # Setup logging
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup performance testing logging."""
        log_file = self.output_dir / f"etl_performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger(__name__)
    
    def _record_metric(self, operation: str, start_time: float, success: bool, 
                      error_message: Optional[str] = None, api_calls: int = 0, 
                      data_processed: int = 0, rate_limited: bool = False) -> PerformanceMetrics:
        """Record a performance metric."""
        end_time = time.time()
        duration = end_time - start_time
        
        metric = PerformanceMetrics(
            operation=operation,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            success=success,
            error_message=error_message,
            api_calls_count=api_calls,
            data_processed=data_processed,
            rate_limited=rate_limited
        )
        
        self.metrics.append(metric)
        return metric
    
    def test_basic_deputy_fetching(self) -> PerformanceMetrics:
        """Test basic deputy fetching performance (baseline)."""
        self.console.print("[cyan]Testing basic deputy fetching...[/cyan]")
        
        start_time = time.time()
        success = False
        error_message = None
        api_calls = 0
        data_processed = 0
        
        try:
            client = CamaraApiClient(wait_ms=150)  # Standard wait time
            deputies = client.fetch_legislators(self.test_legislatura, limit=self.test_deputy_limit)
            
            api_calls = 1  # One paginated call
            data_processed = len(deputies)
            success = True
            
            self.console.print(f"[green]✓ Fetched {len(deputies)} deputies[/green]")
            
        except Exception as e:
            error_message = str(e)
            self.error_counts['api'] += 1
            self.console.print(f"[red]✗ Error: {error_message}[/red]")
        
        return self._record_metric("basic_deputy_fetching", start_time, success, 
                                 error_message, api_calls, data_processed)
    
    def test_enhanced_deputy_fetching(self, wait_ms: int = 150) -> PerformanceMetrics:
        """Test enhanced deputy fetching with individual details."""
        self.console.print(f"[cyan]Testing enhanced deputy fetching (wait_ms={wait_ms})...[/cyan]")
        
        start_time = time.time()
        success = False
        error_message = None
        api_calls = 0
        data_processed = 0
        rate_limited = False
        
        try:
            client = CamaraApiClient(wait_ms=wait_ms)
            processor = CamaraDataProcessor(client=client)
            
            # Fetch basic deputy list
            deputies = client.fetch_legislators(self.test_legislatura, limit=self.test_deputy_limit)
            api_calls += 1
            
            # Process each deputy with enhanced details
            enhanced_count = 0
            for deputy in deputies:
                try:
                    # This will trigger fetch_deputy_details internally
                    enhanced_deputy = processor._enhance_deputado_with_details(deputy)
                    api_calls += 1
                    
                    if hasattr(enhanced_deputy, 'nomeEleitoral') and enhanced_deputy.nomeEleitoral:
                        enhanced_count += 1
                    
                    # Check if we're being rate limited (wait time increases)
                    if wait_ms > 200:
                        rate_limited = True
                        
                except Exception as detail_error:
                    self.logger.warning(f"Failed to enhance deputy {deputy.id}: {detail_error}")
                    continue
            
            data_processed = enhanced_count
            success = True
            
            self.console.print(f"[green]✓ Enhanced {enhanced_count}/{len(deputies)} deputies with {api_calls} API calls[/green]")
            
        except Exception as e:
            error_message = str(e)
            self.error_counts['api'] += 1
            self.console.print(f"[red]✗ Error: {error_message}[/red]")
        
        return self._record_metric("enhanced_deputy_fetching", start_time, success, 
                                 error_message, api_calls, data_processed, rate_limited)
    
    def test_rate_limiting_performance(self) -> List[PerformanceMetrics]:
        """Test performance under different rate limiting scenarios."""
        self.console.print("[cyan]Testing rate limiting performance...[/cyan]")
        
        results = []
        
        for wait_ms in self.rate_limit_wait_times:
            self.console.print(f"[dim]Testing with {wait_ms}ms wait time...[/dim]")
            
            # Record wait time for analysis
            self.rate_limiting_data.append(wait_ms)
            
            # Test enhanced fetching with this wait time
            metric = self.test_enhanced_deputy_fetching(wait_ms)
            results.append(metric)
            
            # Brief pause between tests
            time.sleep(1)
        
        return results
    
    def test_error_handling_resilience(self) -> List[PerformanceMetrics]:
        """Test error handling and resilience."""
        self.console.print("[cyan]Testing error handling resilience...[/cyan]")
        
        results = []
        
        # Test with very aggressive rate limiting (should trigger errors)
        self.console.print("[dim]Testing with aggressive rate limiting (10ms wait)...[/dim]")
        start_time = time.time()
        
        try:
            client = CamaraApiClient(wait_ms=10)  # Very aggressive
            processor = CamaraDataProcessor(client=client)
            
            deputies = client.fetch_legislators(self.test_legislatura, limit=5)
            
            successful_enhancements = 0
            failed_enhancements = 0
            
            for deputy in deputies:
                try:
                    enhanced = processor._enhance_deputado_with_details(deputy)
                    if hasattr(enhanced, 'nomeEleitoral'):
                        successful_enhancements += 1
                except Exception:
                    failed_enhancements += 1
                    self.error_counts['rate_limit'] += 1
            
            success = successful_enhancements > 0
            error_msg = f"Failed {failed_enhancements}/{len(deputies)} enhancements" if failed_enhancements > 0 else None
            
            metric = self._record_metric("aggressive_rate_limiting", start_time, success, 
                                       error_msg, len(deputies) + successful_enhancements, 
                                       successful_enhancements, True)
            results.append(metric)
            
        except Exception as e:
            metric = self._record_metric("aggressive_rate_limiting", start_time, False, str(e))
            results.append(metric)
        
        # Test with invalid deputy ID (should handle gracefully)
        self.console.print("[dim]Testing error handling with invalid deputy ID...[/dim]")
        start_time = time.time()
        
        try:
            client = CamaraApiClient(wait_ms=150)
            
            # Try to fetch details for non-existent deputy
            try:
                details = client.fetch_deputy_details(999999)  # Invalid ID
                success = True  # Should not raise exception, just return empty/error data
                error_msg = None
            except Exception as e:
                success = False
                error_msg = str(e)
                self.error_counts['api'] += 1
            
            metric = self._record_metric("invalid_deputy_handling", start_time, success, error_msg, 1, 0)
            results.append(metric)
            
        except Exception as e:
            metric = self._record_metric("invalid_deputy_handling", start_time, False, str(e))
            results.append(metric)
        
        return results
    
    def test_memory_performance(self) -> PerformanceMetrics:
        """Test memory usage during enhanced processing."""
        self.console.print("[cyan]Testing memory performance...[/cyan]")
        
        start_time = time.time()
        success = False
        error_message = None
        
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Process a larger batch to test memory usage
            client = CamaraApiClient(wait_ms=150)
            processor = CamaraDataProcessor(client=client)
            
            deputies = client.fetch_legislators(self.test_legislatura, limit=20)
            
            # Process all deputies
            for deputy in deputies:
                processor._enhance_deputado_with_details(deputy)
            
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory
            
            success = True
            self.console.print(f"[green]✓ Memory usage: {initial_memory:.1f}MB → {final_memory:.1f}MB (+{memory_increase:.1f}MB)[/green]")
            
            # Log memory usage
            self.logger.info(f"Memory test: Initial={initial_memory:.1f}MB, Final={final_memory:.1f}MB, Increase={memory_increase:.1f}MB")
            
        except ImportError:
            error_message = "psutil not available for memory testing"
            self.console.print(f"[yellow]⚠ {error_message}[/yellow]")
        except Exception as e:
            error_message = str(e)
            self.console.print(f"[red]✗ Memory test error: {error_message}[/red]")
        
        return self._record_metric("memory_performance", start_time, success, error_message, 21, 20)
    
    def analyze_performance_results(self) -> Dict:
        """Analyze all collected performance metrics."""
        self.console.print("[cyan]Analyzing performance results...[/cyan]")
        
        if not self.metrics:
            return {"error": "No metrics collected"}
        
        # Group metrics by operation
        operations = {}
        for metric in self.metrics:
            if metric.operation not in operations:
                operations[metric.operation] = []
            operations[metric.operation].append(metric)
        
        analysis = {
            "timestamp": datetime.now().isoformat(),
            "total_operations": len(self.metrics),
            "operations": {},
            "rate_limiting": self._analyze_rate_limiting(),
            "error_handling": self._analyze_error_handling(),
            "recommendations": []
        }
        
        # Analyze each operation type
        for op_name, op_metrics in operations.items():
            durations = [m.duration for m in op_metrics if m.success]
            api_calls = [m.api_calls_count for m in op_metrics if m.success]
            
            if durations:
                analysis["operations"][op_name] = {
                    "count": len(op_metrics),
                    "success_rate": len([m for m in op_metrics if m.success]) / len(op_metrics),
                    "avg_duration": statistics.mean(durations),
                    "min_duration": min(durations),
                    "max_duration": max(durations),
                    "median_duration": statistics.median(durations),
                    "avg_api_calls": statistics.mean(api_calls) if api_calls else 0,
                    "total_api_calls": sum(api_calls),
                    "duration_std": statistics.stdev(durations) if len(durations) > 1 else 0
                }
        
        # Generate recommendations
        analysis["recommendations"] = self._generate_recommendations(analysis)
        
        return analysis
    
    def _analyze_rate_limiting(self) -> RateLimitingMetrics:
        """Analyze rate limiting performance."""
        rate_limited_metrics = [m for m in self.metrics if m.rate_limited]
        all_wait_times = self.rate_limiting_data
        
        if not all_wait_times:
            return RateLimitingMetrics(0, 0, 0, 0, 0, 0)
        
        return RateLimitingMetrics(
            total_requests=len(self.metrics),
            rate_limited_requests=len(rate_limited_metrics),
            average_wait_time=statistics.mean(all_wait_times),
            max_wait_time=max(all_wait_times),
            min_wait_time=min(all_wait_times),
            rate_limit_percentage=(len(rate_limited_metrics) / len(self.metrics)) * 100
        )
    
    def _analyze_error_handling(self) -> ErrorHandlingMetrics:
        """Analyze error handling performance."""
        total_ops = len(self.metrics)
        successful_ops = len([m for m in self.metrics if m.success])
        failed_ops = total_ops - successful_ops
        
        return ErrorHandlingMetrics(
            total_operations=total_ops,
            successful_operations=successful_ops,
            failed_operations=failed_ops,
            timeout_errors=self.error_counts['timeout'],
            network_errors=self.error_counts['network'],
            api_errors=self.error_counts['api'],
            success_rate=(successful_ops / total_ops) * 100 if total_ops > 0 else 0
        )
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate performance recommendations based on analysis."""
        recommendations = []
        
        # Check enhanced fetching performance
        if "enhanced_deputy_fetching" in analysis["operations"]:
            enhanced_stats = analysis["operations"]["enhanced_deputy_fetching"]
            
            if enhanced_stats["avg_duration"] > 30:  # More than 30 seconds
                recommendations.append("🔴 CRITICAL: Enhanced deputy fetching is too slow (>30s average)")
                recommendations.append("   - Consider implementing parallel processing")
                recommendations.append("   - Increase wait time between API calls")
                recommendations.append("   - Implement caching for deputy details")
            
            if enhanced_stats["success_rate"] < 0.9:  # Less than 90% success
                recommendations.append("🔴 CRITICAL: Low success rate for enhanced fetching")
                recommendations.append("   - Implement better error handling and retries")
                recommendations.append("   - Add exponential backoff for failed requests")
        
        # Check rate limiting
        rate_limit_stats = analysis["rate_limiting"]
        if rate_limit_stats.rate_limit_percentage > 20:  # More than 20% rate limited
            recommendations.append("🟡 WARNING: High rate limiting detected")
            recommendations.append(f"   - {rate_limit_stats.rate_limit_percentage:.1f}% of requests were rate limited")
            recommendations.append("   - Consider increasing wait time between requests")
        
        # Check error handling
        error_stats = analysis["error_handling"]
        if error_stats.success_rate < 95:  # Less than 95% success
            recommendations.append("🟡 WARNING: Error rate is higher than expected")
            recommendations.append(f"   - Success rate: {error_stats.success_rate:.1f}%")
            recommendations.append("   - Review error handling and retry logic")
        
        # Performance comparison recommendations
        if "basic_deputy_fetching" in analysis["operations"] and "enhanced_deputy_fetching" in analysis["operations"]:
            basic_time = analysis["operations"]["basic_deputy_fetching"]["avg_duration"]
            enhanced_time = analysis["operations"]["enhanced_deputy_fetching"]["avg_duration"]
            
            performance_impact = ((enhanced_time - basic_time) / basic_time) * 100
            
            if performance_impact > 500:  # More than 5x slower
                recommendations.append("🔴 CRITICAL: Enhanced fetching is significantly slower")
                recommendations.append(f"   - Performance impact: {performance_impact:.1f}% slower than basic fetching")
                recommendations.append("   - Consider batch processing or caching strategies")
            elif performance_impact > 200:  # More than 2x slower
                recommendations.append("🟡 WARNING: Enhanced fetching has notable performance impact")
                recommendations.append(f"   - Performance impact: {performance_impact:.1f}% slower than basic fetching")
        
        if not recommendations:
            recommendations.append("✅ Performance is within acceptable parameters")
        
        return recommendations
    
    def generate_performance_report(self, analysis: Dict) -> str:
        """Generate a comprehensive performance report."""
        report_lines = [
            "# ETL Performance Test Report",
            "",
            f"**Generated:** {analysis['timestamp']}",
            f"**Total Operations:** {analysis['total_operations']}",
            "",
            "## 📊 Performance Summary",
            ""
        ]
        
        # Operations summary table
        if analysis["operations"]:
            report_lines.extend([
                "| Operation | Count | Success Rate | Avg Duration | API Calls | Status |",
                "|-----------|-------|--------------|--------------|-----------|--------|"
            ])
            
            for op_name, stats in analysis["operations"].items():
                status = "✅ Good" if stats["success_rate"] > 0.95 and stats["avg_duration"] < 30 else \
                        "⚠️ Warning" if stats["success_rate"] > 0.8 else "❌ Poor"
                
                report_lines.append(
                    f"| {op_name} | {stats['count']} | {stats['success_rate']:.1%} | "
                    f"{stats['avg_duration']:.2f}s | {stats['total_api_calls']} | {status} |"
                )
            
            report_lines.append("")
        
        # Rate limiting analysis
        rate_stats = analysis["rate_limiting"]
        report_lines.extend([
            "## 🚦 Rate Limiting Analysis",
            "",
            f"- **Total Requests:** {rate_stats.total_requests}",
            f"- **Rate Limited:** {rate_stats.rate_limited_requests} ({rate_stats.rate_limit_percentage:.1f}%)",
            f"- **Average Wait Time:** {rate_stats.average_wait_time:.0f}ms",
            f"- **Wait Time Range:** {rate_stats.min_wait_time:.0f}ms - {rate_stats.max_wait_time:.0f}ms",
            ""
        ])
        
        # Error handling analysis
        error_stats = analysis["error_handling"]
        report_lines.extend([
            "## 🛡️ Error Handling Analysis",
            "",
            f"- **Success Rate:** {error_stats.success_rate:.1f}%",
            f"- **Total Failures:** {error_stats.failed_operations}",
            f"- **API Errors:** {error_stats.api_errors}",
            f"- **Network Errors:** {error_stats.network_errors}",
            f"- **Timeout Errors:** {error_stats.timeout_errors}",
            ""
        ])
        
        # Recommendations
        if analysis["recommendations"]:
            report_lines.extend([
                "## 💡 Recommendations",
                ""
            ])
            
            for rec in analysis["recommendations"]:
                report_lines.append(f"- {rec}")
            
            report_lines.append("")
        
        # Detailed metrics
        report_lines.extend([
            "## 📈 Detailed Metrics",
            ""
        ])
        
        for op_name, stats in analysis["operations"].items():
            report_lines.extend([
                f"### {op_name}",
                "",
                f"- **Count:** {stats['count']} operations",
                f"- **Success Rate:** {stats['success_rate']:.1%}",
                f"- **Duration:** {stats['avg_duration']:.2f}s ± {stats['duration_std']:.2f}s",
                f"- **Range:** {stats['min_duration']:.2f}s - {stats['max_duration']:.2f}s",
                f"- **Median:** {stats['median_duration']:.2f}s",
                f"- **API Calls:** {stats['total_api_calls']} total ({stats['avg_api_calls']:.1f} avg)",
                ""
            ])
        
        return "\n".join(report_lines)
    
    def save_results(self, analysis: Dict, report: str):
        """Save performance test results and report."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON results
        results_file = self.output_dir / f"etl_performance_results_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        # Save markdown report
        report_file = self.output_dir / f"etl_performance_report_{timestamp}.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        self.console.print(f"[green]✓ Results saved to {results_file}[/green]")
        self.console.print(f"[green]✓ Report saved to {report_file}[/green]")
        
        return results_file, report_file
    
    def display_results_table(self, analysis: Dict):
        """Display results in a formatted table."""
        if not analysis["operations"]:
            self.console.print("[yellow]No operations to display[/yellow]")
            return
        
        table = Table(title="ETL Performance Test Results")
        table.add_column("Operation", style="cyan")
        table.add_column("Count", justify="right")
        table.add_column("Success Rate", justify="right")
        table.add_column("Avg Duration", justify="right")
        table.add_column("API Calls", justify="right")
        table.add_column("Status", justify="center")
        
        for op_name, stats in analysis["operations"].items():
            status = "✅" if stats["success_rate"] > 0.95 and stats["avg_duration"] < 30 else \
                    "⚠️" if stats["success_rate"] > 0.8 else "❌"
            
            table.add_row(
                op_name,
                str(stats["count"]),
                f"{stats['success_rate']:.1%}",
                f"{stats['avg_duration']:.2f}s",
                str(stats["total_api_calls"]),
                status
            )
        
        self.console.print(table)
    
    def run_comprehensive_test(self) -> Tuple[Dict, str]:
        """Run comprehensive ETL performance test suite."""
        self.console.print(Panel.fit(
            "[bold cyan]ETL Performance Testing Suite[/bold cyan]\n"
            "Testing enhanced deputy fetching with additional API calls",
            title="🚀 Starting Tests"
        ))
        
        # Run all performance tests
        with Progress() as progress:
            task = progress.add_task("[cyan]Running performance tests...", total=6)
            
            # Test 1: Basic deputy fetching (baseline)
            progress.update(task, description="[cyan]Testing basic deputy fetching...")
            self.test_basic_deputy_fetching()
            progress.advance(task)
            
            # Test 2: Enhanced deputy fetching
            progress.update(task, description="[cyan]Testing enhanced deputy fetching...")
            self.test_enhanced_deputy_fetching()
            progress.advance(task)
            
            # Test 3: Rate limiting performance
            progress.update(task, description="[cyan]Testing rate limiting scenarios...")
            self.test_rate_limiting_performance()
            progress.advance(task)
            
            # Test 4: Error handling resilience
            progress.update(task, description="[cyan]Testing error handling...")
            self.test_error_handling_resilience()
            progress.advance(task)
            
            # Test 5: Memory performance
            progress.update(task, description="[cyan]Testing memory usage...")
            self.test_memory_performance()
            progress.advance(task)
            
            # Test 6: Analysis
            progress.update(task, description="[cyan]Analyzing results...")
            analysis = self.analyze_performance_results()
            progress.advance(task)
        
        # Generate report
        report = self.generate_performance_report(analysis)
        
        # Display results
        self.console.print("\n")
        self.display_results_table(analysis)
        
        # Show recommendations
        if analysis["recommendations"]:
            self.console.print("\n")
            recommendations_panel = Panel(
                "\n".join(analysis["recommendations"]),
                title="💡 Recommendations",
                border_style="yellow"
            )
            self.console.print(recommendations_panel)
        
        # Save results
        self.save_results(analysis, report)
        
        return analysis, report


def main():
    """Main function to run ETL performance tests."""
    tester = ETLPerformanceTester()
    
    try:
        analysis, report = tester.run_comprehensive_test()
        
        # Print summary
        print("\n" + "="*60)
        print("ETL PERFORMANCE TEST SUMMARY")
        print("="*60)
        
        total_ops = analysis["total_operations"]
        error_stats = analysis["error_handling"]
        
        print(f"Total Operations: {total_ops}")
        print(f"Success Rate: {error_stats.success_rate:.1f}%")
        print(f"Failed Operations: {error_stats.failed_operations}")
        
        if analysis["recommendations"]:
            print("\nKey Recommendations:")
            for rec in analysis["recommendations"][:3]:  # Show top 3
                print(f"  - {rec}")
        
        return 0
        
    except Exception as e:
        print(f"Error running performance tests: {e}")
        return 1


if __name__ == "__main__":
    exit(main())