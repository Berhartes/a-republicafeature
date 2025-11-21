# ETL Performance Testing Guide

This guide explains how to use the ETL performance testing suite to monitor the impact of enhanced deputy detail fetching on overall ETL performance, rate limiting, and error handling.

## Overview

The performance testing suite provides comprehensive monitoring of:

- **API Call Performance**: Measures the impact of additional API calls for deputy details
- **Rate Limiting**: Tests different wait times and monitors rate limiting behavior
- **Error Handling**: Validates resilience under various error conditions
- **Memory Usage**: Monitors memory consumption during enhanced processing
- **Performance Comparison**: Compares basic vs enhanced deputy fetching

## Quick Start

### Running Performance Tests

```bash
# Run standard performance tests
cd packages/etlpython
python scripts/run_performance_tests.py

# Run quick tests with limited deputies
python scripts/run_performance_tests.py --quick --deputy-limit 5

# Run comprehensive tests with custom settings
python scripts/run_performance_tests.py --deputy-limit 20 --output-dir ./my_reports
```

### Command Line Options

- `--deputy-limit N`: Limit number of deputies to test (default: 10)
- `--legislatura N`: Legislature to test (default: 57)
- `--output-dir PATH`: Output directory for reports (default: performance_reports)
- `--verbose`: Enable verbose logging
- `--quick`: Run quick tests only (skip comprehensive rate limiting tests)

## Test Suite Components

### 1. Basic Deputy Fetching (Baseline)

Tests the performance of fetching deputy lists without enhanced details.

**Metrics Collected:**
- Duration of API call
- Number of deputies fetched
- Success/failure rate

### 2. Enhanced Deputy Fetching

Tests the performance of fetching deputy details with additional API calls for `nomeEleitoral` and `siglaPartido`.

**Metrics Collected:**
- Total duration including detail fetching
- Number of additional API calls
- Success rate of detail enhancement
- Data processing efficiency

### 3. Rate Limiting Performance

Tests performance under different rate limiting scenarios by varying wait times between API calls.

**Test Scenarios:**
- 50ms wait time (aggressive)
- 100ms wait time (moderate)
- 150ms wait time (standard)
- 200ms wait time (conservative)
- 300ms wait time (very conservative)

**Metrics Collected:**
- Average wait time impact
- Rate limiting detection
- Performance degradation analysis

### 4. Error Handling Resilience

Tests the system's ability to handle various error conditions gracefully.

**Test Scenarios:**
- Aggressive rate limiting (10ms wait)
- Invalid deputy IDs
- Network timeouts
- API errors

**Metrics Collected:**
- Error recovery rate
- Fallback behavior effectiveness
- System stability under stress

### 5. Memory Performance

Monitors memory usage during enhanced processing to detect memory leaks or excessive consumption.

**Metrics Collected:**
- Initial memory usage
- Peak memory usage
- Memory increase per deputy processed
- Memory cleanup effectiveness

## Understanding Results

### Performance Report Structure

The performance test generates comprehensive reports in both JSON and Markdown formats:

```
performance_reports/
├── etl_performance_results_20241027_143022.json
├── etl_performance_report_20241027_143022.md
└── etl_performance_20241027_143022.log
```

### Key Metrics

#### Success Rate
- **Good**: >95% success rate
- **Warning**: 80-95% success rate  
- **Poor**: <80% success rate

#### Performance Impact
- **Acceptable**: <200% slower than baseline
- **Warning**: 200-500% slower than baseline
- **Critical**: >500% slower than baseline

#### Rate Limiting
- **Good**: <10% of requests rate limited
- **Warning**: 10-20% of requests rate limited
- **Critical**: >20% of requests rate limited

### Sample Report Output

```markdown
# ETL Performance Test Report

**Generated:** 2024-10-27T14:30:22

## 📊 Performance Summary

| Operation | Count | Success Rate | Avg Duration | API Calls | Status |
|-----------|-------|--------------|--------------|-----------|--------|
| basic_deputy_fetching | 1 | 100.0% | 2.45s | 1 | ✅ Good |
| enhanced_deputy_fetching | 5 | 98.0% | 12.34s | 55 | ⚠️ Warning |

## 🚦 Rate Limiting Analysis

- **Total Requests:** 61
- **Rate Limited:** 8 (13.1%)
- **Average Wait Time:** 180ms
- **Wait Time Range:** 50ms - 300ms

## 💡 Recommendations

- 🟡 WARNING: Enhanced fetching has notable performance impact
  - Performance impact: 404% slower than basic fetching
- ✅ Rate limiting is within acceptable parameters
```

## Integration with CI/CD

### Automated Performance Testing

Add performance tests to your CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: ETL Performance Tests

on:
  pull_request:
    paths:
      - 'packages/etlpython/**'
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd packages/etlpython
          pip install -e .
      
      - name: Run performance tests
        run: |
          cd packages/etlpython
          python scripts/run_performance_tests.py --quick --deputy-limit 5
      
      - name: Upload performance reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: packages/etlpython/performance_reports/
```

### Performance Monitoring Alerts

Set up alerts for performance degradation:

```python
# Example: Check if performance impact is too high
def check_performance_alert(report_data):
    operations = report_data.get('operations', {})
    
    if 'enhanced_deputy_fetching' in operations:
        enhanced_stats = operations['enhanced_deputy_fetching']
        
        # Alert if success rate drops below 90%
        if enhanced_stats['success_rate'] < 0.9:
            send_alert("ETL success rate below 90%")
        
        # Alert if average duration exceeds 30 seconds
        if enhanced_stats['avg_duration'] > 30:
            send_alert("ETL performance degraded - >30s average")
```

## Programmatic Usage

### Using the Performance Tester in Code

```python
from etlpython.performance import ETLPerformanceTester

# Create tester instance
tester = ETLPerformanceTester(output_dir=Path("./reports"))

# Configure test parameters
tester.test_legislatura = 57
tester.test_deputy_limit = 15

# Run specific tests
basic_metric = tester.test_basic_deputy_fetching()
enhanced_metric = tester.test_enhanced_deputy_fetching()

# Analyze results
analysis = tester.analyze_performance_results()
report = tester.generate_performance_report(analysis)

# Save results
tester.save_results(analysis, report)
```

### Custom Performance Metrics

```python
# Add custom performance tracking
import time

start_time = time.time()
# ... your ETL operation ...
success = True
error_message = None

# Record custom metric
metric = tester._record_metric(
    operation="custom_etl_step",
    start_time=start_time,
    success=success,
    error_message=error_message,
    api_calls=5,
    data_processed=100
)
```

## Troubleshooting

### Common Issues

#### 1. API Rate Limiting
**Symptoms:** High rate limiting percentage, frequent 429 errors
**Solutions:**
- Increase wait time between requests
- Implement exponential backoff
- Use caching for repeated requests

#### 2. Memory Issues
**Symptoms:** Increasing memory usage, out of memory errors
**Solutions:**
- Process deputies in smaller batches
- Clear processed data from memory
- Use generators instead of lists

#### 3. Network Timeouts
**Symptoms:** High timeout error count, inconsistent performance
**Solutions:**
- Increase request timeout values
- Implement retry logic with backoff
- Add network connectivity checks

### Debug Mode

Enable verbose logging for detailed debugging:

```bash
python scripts/run_performance_tests.py --verbose --deputy-limit 3
```

This will provide detailed logs of:
- Individual API calls and their timing
- Error details and stack traces
- Memory usage at each step
- Rate limiting detection

## Best Practices

### 1. Regular Performance Monitoring
- Run performance tests weekly
- Monitor trends over time
- Set up automated alerts for degradation

### 2. Test Environment Consistency
- Use consistent test data (same legislature)
- Run tests from the same network environment
- Account for API rate limiting in test scheduling

### 3. Performance Optimization
- Cache deputy details when possible
- Use appropriate wait times for your use case
- Monitor and optimize memory usage
- Implement graceful error handling

### 4. Reporting and Analysis
- Keep historical performance data
- Compare performance across different configurations
- Document performance requirements and thresholds
- Share performance reports with stakeholders

## Requirements Validation

This performance testing suite validates the following requirements from the specification:

- **Requirement 2.1**: Enhanced ETL preserves nomeEleitoral from API
- **Requirement 2.2**: Enhanced ETL preserves siglaPartido from API  
- **Requirement 3.1**: ETL handles additional API calls efficiently

The tests ensure that the enhanced deputy fetching functionality meets performance expectations while maintaining data integrity and system reliability.