"""
Tests for ETL performance testing functionality.

These tests validate that the performance testing module works correctly
and can measure the impact of enhanced deputy fetching.
"""

import pytest
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

from etlpython.performance.etl_performance_tester import (
    ETLPerformanceTester,
    PerformanceMetrics,
    RateLimitingMetrics,
    ErrorHandlingMetrics
)


class TestETLPerformanceTester:
    """Test cases for ETL performance tester."""
    
    def test_performance_tester_initialization(self):
        """Test that performance tester initializes correctly."""
        with tempfile.TemporaryDirectory() as temp_dir:
            tester = ETLPerformanceTester(output_dir=Path(temp_dir))
            
            assert tester.output_dir == Path(temp_dir)
            assert tester.test_legislatura == 57
            assert tester.test_deputy_limit == 10
            assert len(tester.metrics) == 0
            assert len(tester.rate_limiting_data) == 0
    
    def test_record_metric(self):
        """Test metric recording functionality."""
        tester = ETLPerformanceTester()
        
        import time
        start_time = time.time()
        time.sleep(0.01)  # Small delay to ensure duration > 0
        
        metric = tester._record_metric(
            operation="test_operation",
            start_time=start_time,
            success=True,
            api_calls=5,
            data_processed=10
        )
        
        assert metric.operation == "test_operation"
        assert metric.success is True
        assert metric.duration > 0
        assert metric.api_calls_count == 5
        assert metric.data_processed == 10
        assert len(tester.metrics) == 1
    
    @patch('etlpython.performance.etl_performance_tester.CamaraApiClient')
    def test_basic_deputy_fetching_success(self, mock_client_class):
        """Test basic deputy fetching performance measurement."""
        # Mock the client and its methods
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock deputy data
        mock_deputy = Mock()
        mock_deputy.id = 1
        mock_deputy.nome = "Test Deputy"
        
        mock_client.fetch_legislators.return_value = [mock_deputy]
        
        tester = ETLPerformanceTester()
        metric = tester.test_basic_deputy_fetching()
        
        assert metric.success is True
        assert metric.operation == "basic_deputy_fetching"
        assert metric.api_calls_count == 1
        assert metric.data_processed == 1
        assert metric.duration > 0
    
    @patch('etlpython.performance.etl_performance_tester.CamaraApiClient')
    def test_basic_deputy_fetching_failure(self, mock_client_class):
        """Test basic deputy fetching with API failure."""
        # Mock the client to raise an exception
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        mock_client.fetch_legislators.side_effect = Exception("API Error")
        
        tester = ETLPerformanceTester()
        metric = tester.test_basic_deputy_fetching()
        
        assert metric.success is False
        assert metric.error_message == "API Error"
        assert metric.operation == "basic_deputy_fetching"
        assert tester.error_counts['api'] == 1
    
    @patch('etlpython.performance.etl_performance_tester.CamaraDataProcessor')
    @patch('etlpython.performance.etl_performance_tester.CamaraApiClient')
    def test_enhanced_deputy_fetching_success(self, mock_client_class, mock_processor_class):
        """Test enhanced deputy fetching performance measurement."""
        # Mock the client
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock deputy data
        mock_deputy = Mock()
        mock_deputy.id = 1
        mock_deputy.nome = "Test Deputy"
        
        mock_client.fetch_legislators.return_value = [mock_deputy]
        
        # Mock the processor
        mock_processor = Mock()
        mock_processor_class.return_value = mock_processor
        
        # Mock enhanced deputy with nomeEleitoral
        mock_enhanced_deputy = Mock()
        mock_enhanced_deputy.nomeEleitoral = "Electoral Name"
        mock_processor._enhance_deputado_with_details.return_value = mock_enhanced_deputy
        
        tester = ETLPerformanceTester()
        metric = tester.test_enhanced_deputy_fetching()
        
        assert metric.success is True
        assert metric.operation == "enhanced_deputy_fetching"
        assert metric.api_calls_count == 2  # 1 for list + 1 for details
        assert metric.data_processed == 1
        assert metric.duration > 0
    
    def test_analyze_rate_limiting(self):
        """Test rate limiting analysis."""
        tester = ETLPerformanceTester()
        
        # Add some test data
        tester.rate_limiting_data = [100, 150, 200, 300]
        
        # Add some metrics with rate limiting
        tester.metrics = [
            PerformanceMetrics("test1", 0, 1, 1, True, rate_limited=False),
            PerformanceMetrics("test2", 0, 1, 1, True, rate_limited=True),
            PerformanceMetrics("test3", 0, 1, 1, True, rate_limited=True),
        ]
        
        rate_stats = tester._analyze_rate_limiting()
        
        assert rate_stats.total_requests == 3
        assert rate_stats.rate_limited_requests == 2
        assert rate_stats.average_wait_time == 187.5  # (100+150+200+300)/4
        assert rate_stats.max_wait_time == 300
        assert rate_stats.min_wait_time == 100
        assert rate_stats.rate_limit_percentage == pytest.approx(66.67, rel=1e-2)
    
    def test_analyze_error_handling(self):
        """Test error handling analysis."""
        tester = ETLPerformanceTester()
        
        # Add some test metrics
        tester.metrics = [
            PerformanceMetrics("test1", 0, 1, 1, True),
            PerformanceMetrics("test2", 0, 1, 1, False, "Error 1"),
            PerformanceMetrics("test3", 0, 1, 1, True),
            PerformanceMetrics("test4", 0, 1, 1, False, "Error 2"),
        ]
        
        # Add some error counts
        tester.error_counts = {
            'timeout': 1,
            'network': 0,
            'api': 2,
            'rate_limit': 0
        }
        
        error_stats = tester._analyze_error_handling()
        
        assert error_stats.total_operations == 4
        assert error_stats.successful_operations == 2
        assert error_stats.failed_operations == 2
        assert error_stats.success_rate == 50.0
        assert error_stats.api_errors == 2
        assert error_stats.timeout_errors == 1
    
    def test_generate_recommendations_good_performance(self):
        """Test recommendation generation for good performance."""
        tester = ETLPerformanceTester()
        
        analysis = {
            "operations": {
                "enhanced_deputy_fetching": {
                    "avg_duration": 10,  # Good performance
                    "success_rate": 0.98  # Good success rate
                }
            },
            "rate_limiting": RateLimitingMetrics(100, 5, 150, 200, 100, 5.0),
            "error_handling": ErrorHandlingMetrics(100, 98, 2, 0, 0, 1, 98.0)
        }
        
        recommendations = tester._generate_recommendations(analysis)
        
        # Should have positive recommendation for good performance
        assert any("✅" in rec for rec in recommendations)
    
    def test_generate_recommendations_poor_performance(self):
        """Test recommendation generation for poor performance."""
        tester = ETLPerformanceTester()
        
        analysis = {
            "operations": {
                "enhanced_deputy_fetching": {
                    "avg_duration": 45,  # Poor performance (>30s)
                    "success_rate": 0.75  # Poor success rate (<90%)
                }
            },
            "rate_limiting": RateLimitingMetrics(100, 25, 150, 200, 100, 25.0),
            "error_handling": ErrorHandlingMetrics(100, 75, 25, 5, 3, 10, 75.0)
        }
        
        recommendations = tester._generate_recommendations(analysis)
        
        # Should have critical recommendations
        assert any("🔴 CRITICAL" in rec for rec in recommendations)
        assert any("Enhanced deputy fetching is too slow" in rec for rec in recommendations)
        assert any("Low success rate" in rec for rec in recommendations)
    
    def test_performance_metrics_dataclass(self):
        """Test PerformanceMetrics dataclass functionality."""
        metric = PerformanceMetrics(
            operation="test",
            start_time=1000.0,
            end_time=1001.5,
            duration=1.5,
            success=True,
            api_calls_count=3,
            data_processed=10
        )
        
        assert metric.duration_ms == 1500.0
        assert metric.operation == "test"
        assert metric.success is True
    
    def test_generate_performance_report(self):
        """Test performance report generation."""
        tester = ETLPerformanceTester()
        
        analysis = {
            "timestamp": "2024-01-01T12:00:00",
            "total_operations": 5,
            "operations": {
                "test_operation": {
                    "count": 3,
                    "success_rate": 0.9,
                    "avg_duration": 15.5,
                    "total_api_calls": 10,
                    "avg_api_calls": 3.3,
                    "min_duration": 10.0,
                    "max_duration": 20.0,
                    "median_duration": 15.0,
                    "duration_std": 2.5
                }
            },
            "rate_limiting": RateLimitingMetrics(10, 2, 150, 200, 100, 20.0),
            "error_handling": ErrorHandlingMetrics(10, 9, 1, 0, 0, 1, 90.0),
            "recommendations": ["✅ Performance is good", "Consider optimization"]
        }
        
        report = tester.generate_performance_report(analysis)
        
        assert "ETL Performance Test Report" in report
        assert "2024-01-01T12:00:00" in report
        assert "test_operation" in report
        assert "90.0%" in report  # Success rate
        assert "15.50s" in report  # Average duration
        assert "Rate Limiting Analysis" in report
        assert "Error Handling Analysis" in report
        assert "Recommendations" in report


class TestPerformanceDataClasses:
    """Test performance-related data classes."""
    
    def test_rate_limiting_metrics(self):
        """Test RateLimitingMetrics dataclass."""
        metrics = RateLimitingMetrics(
            total_requests=100,
            rate_limited_requests=20,
            average_wait_time=150.5,
            max_wait_time=300.0,
            min_wait_time=100.0,
            rate_limit_percentage=20.0
        )
        
        assert metrics.total_requests == 100
        assert metrics.rate_limited_requests == 20
        assert metrics.rate_limit_percentage == 20.0
    
    def test_error_handling_metrics(self):
        """Test ErrorHandlingMetrics dataclass."""
        metrics = ErrorHandlingMetrics(
            total_operations=50,
            successful_operations=45,
            failed_operations=5,
            timeout_errors=2,
            network_errors=1,
            api_errors=2,
            success_rate=90.0
        )
        
        assert metrics.total_operations == 50
        assert metrics.successful_operations == 45
        assert metrics.success_rate == 90.0