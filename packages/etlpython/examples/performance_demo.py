#!/usr/bin/env python3
"""
ETL Performance Testing Demonstration

This script demonstrates the ETL performance testing capabilities
by running a simplified version of the performance tests and showing
the results in a user-friendly format.
"""

import sys
import time
from pathlib import Path
from unittest.mock import Mock, patch

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from etlpython.performance.etl_performance_tester import ETLPerformanceTester
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


def create_mock_deputy_data():
    """Create mock deputy data for demonstration."""
    mock_deputies = []
    
    for i in range(1, 6):  # Create 5 mock deputies
        deputy = Mock()
        deputy.id = i
        deputy.nome = f"Deputy {i}"
        deputy.siglaPartido = f"PARTY{i}"
        deputy.siglaUf = "SP"
        mock_deputies.append(deputy)
    
    return mock_deputies


def simulate_api_delay(base_delay=0.1, variation=0.05):
    """Simulate API call delay with some variation."""
    import random
    delay = base_delay + random.uniform(-variation, variation)
    time.sleep(max(0.01, delay))  # Minimum 10ms delay


def demo_basic_vs_enhanced_performance():
    """Demonstrate the performance difference between basic and enhanced fetching."""
    console = Console()
    
    console.print(Panel.fit(
        "[bold cyan]ETL Performance Testing Demo[/bold cyan]\n"
        "Comparing basic vs enhanced deputy fetching",
        title="🚀 Demo Starting"
    ))
    
    # Create tester with demo output directory
    demo_dir = Path("demo_performance_reports")
    tester = ETLPerformanceTester(output_dir=demo_dir)
    tester.test_deputy_limit = 5  # Small number for demo
    
    console.print("[cyan]Setting up mock data and API clients...[/cyan]")
    
    # Mock the API client for basic fetching
    with patch('etlpython.performance.etl_performance_tester.CamaraApiClient') as mock_client_class:
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Setup basic deputy fetching mock
        mock_deputies = create_mock_deputy_data()
        mock_client.fetch_legislators.return_value = mock_deputies
        
        # Add realistic delay simulation
        def mock_fetch_legislators(*args, **kwargs):
            simulate_api_delay(0.2)  # 200ms base delay
            return mock_deputies
        
        mock_client.fetch_legislators.side_effect = mock_fetch_legislators
        
        console.print("[dim]Running basic deputy fetching test...[/dim]")
        basic_metric = tester.test_basic_deputy_fetching()
        
        console.print(f"[green]✓ Basic fetching completed in {basic_metric.duration:.2f}s[/green]")
    
    # Mock the enhanced fetching
    with patch('etlpython.performance.etl_performance_tester.CamaraApiClient') as mock_client_class, \
         patch('etlpython.performance.etl_performance_tester.CamaraDataProcessor') as mock_processor_class:
        
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        mock_processor = Mock()
        mock_processor_class.return_value = mock_processor
        
        # Setup enhanced fetching mocks
        mock_client.fetch_legislators.return_value = mock_deputies
        
        def mock_fetch_legislators_enhanced(*args, **kwargs):
            simulate_api_delay(0.2)  # 200ms for list
            return mock_deputies
        
        def mock_enhance_deputy(deputy):
            simulate_api_delay(0.15)  # 150ms per deputy detail
            enhanced = Mock()
            enhanced.id = deputy.id
            enhanced.nome = deputy.nome
            enhanced.nomeEleitoral = f"Electoral Name {deputy.id}"
            enhanced.siglaPartido = f"ENHANCED_PARTY{deputy.id}"
            return enhanced
        
        mock_client.fetch_legislators.side_effect = mock_fetch_legislators_enhanced
        mock_processor._enhance_deputado_with_details.side_effect = mock_enhance_deputy
        
        console.print("[dim]Running enhanced deputy fetching test...[/dim]")
        enhanced_metric = tester.test_enhanced_deputy_fetching()
        
        console.print(f"[green]✓ Enhanced fetching completed in {enhanced_metric.duration:.2f}s[/green]")
    
    # Calculate and display performance comparison
    performance_impact = ((enhanced_metric.duration - basic_metric.duration) / basic_metric.duration) * 100
    
    console.print("\n")
    
    # Create comparison table
    table = Table(title="Performance Comparison Results")
    table.add_column("Metric", style="cyan")
    table.add_column("Basic Fetching", justify="right")
    table.add_column("Enhanced Fetching", justify="right")
    table.add_column("Impact", justify="right")
    
    table.add_row(
        "Duration",
        f"{basic_metric.duration:.2f}s",
        f"{enhanced_metric.duration:.2f}s",
        f"+{performance_impact:.1f}%"
    )
    
    table.add_row(
        "API Calls",
        str(basic_metric.api_calls_count),
        str(enhanced_metric.api_calls_count),
        f"+{enhanced_metric.api_calls_count - basic_metric.api_calls_count}"
    )
    
    table.add_row(
        "Data Processed",
        str(basic_metric.data_processed),
        str(enhanced_metric.data_processed),
        "Same"
    )
    
    table.add_row(
        "Success Rate",
        "✅ 100%" if basic_metric.success else "❌ Failed",
        "✅ 100%" if enhanced_metric.success else "❌ Failed",
        "Maintained"
    )
    
    console.print(table)
    
    # Generate analysis and recommendations
    console.print("\n[cyan]Analyzing results...[/cyan]")
    analysis = tester.analyze_performance_results()
    
    # Display recommendations
    if analysis["recommendations"]:
        console.print("\n")
        recommendations_panel = Panel(
            "\n".join(analysis["recommendations"]),
            title="💡 Performance Recommendations",
            border_style="yellow"
        )
        console.print(recommendations_panel)
    
    # Show summary
    console.print(f"\n[bold]Summary:[/bold]")
    console.print(f"• Enhanced fetching is {performance_impact:.1f}% slower than basic fetching")
    console.print(f"• Additional {enhanced_metric.api_calls_count - basic_metric.api_calls_count} API calls required")
    console.print(f"• Both methods achieved 100% success rate")
    
    if performance_impact > 300:
        console.print(f"• [red]⚠️ Performance impact is significant (>{performance_impact:.0f}%)[/red]")
        console.print(f"• [yellow]Consider implementing caching or batch processing[/yellow]")
    elif performance_impact > 100:
        console.print(f"• [yellow]⚠️ Moderate performance impact ({performance_impact:.0f}%)[/yellow]")
        console.print(f"• [yellow]Monitor in production environment[/yellow]")
    else:
        console.print(f"• [green]✅ Performance impact is acceptable ({performance_impact:.0f}%)[/green]")
    
    return analysis


def demo_rate_limiting_scenarios():
    """Demonstrate rate limiting performance testing."""
    console = Console()
    
    console.print("\n" + "="*60)
    console.print("[bold cyan]Rate Limiting Scenarios Demo[/bold cyan]")
    console.print("="*60)
    
    # Simulate different wait times and their impact
    wait_times = [50, 100, 150, 200, 300]  # milliseconds
    results = []
    
    for wait_ms in wait_times:
        console.print(f"[dim]Testing with {wait_ms}ms wait time...[/dim]")
        
        # Simulate the impact of different wait times
        start_time = time.time()
        
        # Simulate 5 deputies with individual detail fetching
        for i in range(5):
            simulate_api_delay(wait_ms / 1000.0, 0.01)  # Convert to seconds
        
        duration = time.time() - start_time
        
        # Determine if this would be rate limited (very rough simulation)
        rate_limited = wait_ms < 100
        
        results.append({
            'wait_ms': wait_ms,
            'duration': duration,
            'rate_limited': rate_limited
        })
        
        status = "❌ Rate Limited" if rate_limited else "✅ OK"
        console.print(f"  {wait_ms}ms wait: {duration:.2f}s total - {status}")
    
    # Create rate limiting analysis table
    console.print("\n")
    table = Table(title="Rate Limiting Analysis")
    table.add_column("Wait Time", justify="right")
    table.add_column("Total Duration", justify="right")
    table.add_column("Rate Limited", justify="center")
    table.add_column("Recommendation", style="dim")
    
    for result in results:
        rate_limited_icon = "❌" if result['rate_limited'] else "✅"
        
        if result['wait_ms'] < 100:
            recommendation = "Too aggressive"
        elif result['wait_ms'] < 150:
            recommendation = "Risky"
        elif result['wait_ms'] < 200:
            recommendation = "Balanced"
        else:
            recommendation = "Conservative"
        
        table.add_row(
            f"{result['wait_ms']}ms",
            f"{result['duration']:.2f}s",
            rate_limited_icon,
            recommendation
        )
    
    console.print(table)
    
    # Show optimal recommendation
    optimal_wait = 150  # Based on current ETL implementation
    console.print(f"\n[bold]Recommendation:[/bold] Use {optimal_wait}ms wait time for optimal balance")
    console.print("• Minimizes rate limiting risk")
    console.print("• Maintains reasonable performance")
    console.print("• Follows API best practices")


def main():
    """Run the performance testing demonstration."""
    console = Console()
    
    try:
        # Run basic vs enhanced performance demo
        analysis = demo_basic_vs_enhanced_performance()
        
        # Run rate limiting demo
        demo_rate_limiting_scenarios()
        
        # Final summary
        console.print("\n" + "="*60)
        console.print("[bold green]Demo Completed Successfully! 🎉[/bold green]")
        console.print("="*60)
        
        console.print("\n[bold]Key Takeaways:[/bold]")
        console.print("1. Enhanced deputy fetching requires additional API calls")
        console.print("2. Performance impact depends on wait time configuration")
        console.print("3. Rate limiting must be considered for production use")
        console.print("4. Monitoring and testing are essential for optimization")
        
        console.print(f"\n[dim]Demo reports saved to: demo_performance_reports/[/dim]")
        
        return 0
        
    except KeyboardInterrupt:
        console.print("\n[yellow]Demo interrupted by user[/yellow]")
        return 130
        
    except Exception as e:
        console.print(f"\n[red]Demo failed: {e}[/red]")
        return 1


if __name__ == "__main__":
    sys.exit(main())