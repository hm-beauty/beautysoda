# Google Sheets Integration - Comprehensive Testing Strategy

## 📋 Overview

This document outlines the complete testing strategy for the improved Google Sheets integration module (`googleSheets-bolt-final.ts`).

---

## 🎯 Test Objectives

1. **Functional Correctness**: Verify all features work as designed
2. **Error Handling**: Ensure graceful failure and helpful error messages
3. **Performance**: Validate response times and resource usage
4. **Reliability**: Test retry mechanisms and failure recovery
5. **Data Integrity**: Confirm data is transmitted and stored correctly
6. **Edge Cases**: Handle unusual inputs and boundary conditions

---

## 🧪 Test Categories

### 1. Unit Tests

#### 1.1 Data Validation Tests

```typescript
describe('validateSubmissionData', () => {
  test('should pass with valid data', () => {
    const validData = {
      quoteNumber: 'BS20251107001',
      timestamp: new Date().toISOString(),
      formData: {
        customerType: 'company',
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        contactName: 'John Doe',
        phone: '0912345678',
        email: 'test@example.com',
        invoiceEmail: 'invoice@example.com',
        selectedPlan: 'plan2',
        addons: [],
        multiStore: false,
        stampMethod: 'contact',
        agreeTerms: true
      },
      pricing: {
        planPrice: 9000,
        addonPrice: 0,
        multiStorePrice: 0,
        totalPrice: 9000
      }
    };

    const result = validateSubmissionData(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail with missing required fields', () => {
    const invalidData = {
      quoteNumber: 'BS20251107001',
      formData: {
        // Missing required fields
      }
    };

    const result = validateSubmissionData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should validate email format', () => {
    const data = {
      // ... other valid fields
      formData: {
        email: 'invalid-email',
        // ... other fields
      }
    };

    const result = validateSubmissionData(data);
    expect(result.errors).toContain('Email 格式不正確');
  });

  test('should validate Taiwan phone format', () => {
    const validPhones = [
      '0912345678',      // Mobile
      '02-12345678',     // Taipei landline
      '0912-345-678',    // Mobile with dashes
      '02 1234 5678'     // Landline with spaces
    ];

    // Test each valid format
  });

  test('should validate tax ID for companies', () => {
    const data = {
      formData: {
        customerType: 'company',
        taxId: '1234567',  // Only 7 digits
        // ... other fields
      }
    };

    const result = validateSubmissionData(data);
    expect(result.errors).toContain('統一編號必須是 8 位數字');
  });
});
```

#### 1.2 Method Selection Tests

```typescript
describe('decideSubmissionMethod', () => {
  test('should choose GET for small payloads', () => {
    const smallPayload = {
      quoteNumber: 'BS001',
      companyName: 'Test',
      email: 'test@example.com'
      // Small data
    };

    const method = decideSubmissionMethod(smallPayload);
    expect(method).toBe('GET');
  });

  test('should choose POST for large payloads', () => {
    const largePayload = {
      quoteNumber: 'BS001',
      signature: 'data:image/png;base64,' + 'A'.repeat(10000),
      stampFile: 'data:image/png;base64,' + 'B'.repeat(10000)
      // Large base64 images
    };

    const method = decideSubmissionMethod(largePayload);
    expect(method).toBe('POST');
  });

  test('should respect MAX_URL_LENGTH constant', () => {
    // Create payload that exactly exceeds MAX_URL_LENGTH
    const urlLength = calculateUrlLength(payload);
    expect(urlLength > MAX_URL_LENGTH).toBe(true);

    const method = decideSubmissionMethod(payload);
    expect(method).toBe('POST');
  });
});
```

#### 1.3 Image Compression Tests

```typescript
describe('compressPayloadImages', () => {
  test('should compress large signature images', async () => {
    const payload = {
      signature: 'data:image/png;base64,' + generateLargeBase64(1024 * 1024) // 1MB
    };

    const compressed = await compressPayloadImages(payload);
    expect(compressed.signature.length).toBeLessThan(payload.signature.length);
  });

  test('should not compress small images', async () => {
    const payload = {
      signature: 'data:image/png;base64,' + generateLargeBase64(100 * 1024) // 100KB
    };

    const compressed = await compressPayloadImages(payload);
    expect(compressed.signature).toBe(payload.signature); // Unchanged
  });

  test('should handle missing images gracefully', async () => {
    const payload = {
      companyName: 'Test'
      // No images
    };

    const compressed = await compressPayloadImages(payload);
    expect(compressed).toEqual(payload);
  });

  test('should maintain image quality', async () => {
    const originalImage = createTestImage();
    const base64 = await imageToBase64(originalImage);

    const compressed = await compressBase64Image(base64, 0.8);

    // Verify compressed image is still valid
    const img = await loadBase64Image(compressed);
    expect(img.width).toBeGreaterThan(0);
    expect(img.height).toBeGreaterThan(0);
  });
});
```

#### 1.4 Error Message Generation Tests

```typescript
describe('generateUserFriendlyError', () => {
  test('should handle network errors', () => {
    const error = new Error('Failed to fetch');
    const message = generateUserFriendlyError(error);
    expect(message).toContain('網路連線失敗');
  });

  test('should handle timeout errors', () => {
    const error = { name: 'AbortError', message: 'timeout' };
    const message = generateUserFriendlyError(error);
    expect(message).toContain('逾時');
  });

  test('should handle HTTP status errors', () => {
    const errors = [
      { message: 'HTTP 403', expected: '權限設定問題' },
      { message: 'HTTP 404', expected: '端點錯誤' },
      { message: 'HTTP 500', expected: '執行錯誤' }
    ];

    errors.forEach(({ message, expected }) => {
      const result = generateUserFriendlyError(new Error(message));
      expect(result).toContain(expected);
    });
  });

  test('should include contact email for unknown errors', () => {
    const error = new Error('Unknown error');
    const message = generateUserFriendlyError(error);
    expect(message).toContain(CONFIG.COMPANY.email);
  });
});
```

---

### 2. Integration Tests

#### 2.1 Connection Tests

```typescript
describe('Google Apps Script Connection', () => {
  test('should successfully connect to Apps Script', async () => {
    const result = await testConnection();
    expect(result).toBe(true);
  });

  test('should handle Apps Script downtime', async () => {
    // Mock fetch to simulate server error
    global.fetch = jest.fn().mockRejectedValue(new Error('Service unavailable'));

    const result = await testConnection();
    expect(result).toBe(false);
  });

  test('should timeout after 10 seconds', async () => {
    // Mock fetch to delay indefinitely
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 20000))
    );

    const startTime = Date.now();
    const result = await testConnection();
    const duration = Date.now() - startTime;

    expect(result).toBe(false);
    expect(duration).toBeLessThan(11000); // Should timeout before 11s
  });
});
```

#### 2.2 GET Submission Tests

```typescript
describe('submitViaGET', () => {
  test('should successfully submit small data via GET', async () => {
    const payload = {
      quoteNumber: 'BS20251107001',
      companyName: 'Test Company',
      email: 'test@example.com',
      totalPrice: 9000
    };

    await expect(submitViaGET(payload)).resolves.not.toThrow();
  });

  test('should include all parameters in URL', async () => {
    const payload = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    };

    // Spy on fetch
    const fetchSpy = jest.spyOn(global, 'fetch');

    await submitViaGET(payload);

    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('key1=value1');
    expect(calledUrl).toContain('key2=value2');
    expect(calledUrl).toContain('key3=value3');
  });

  test('should handle special characters in parameters', async () => {
    const payload = {
      companyName: 'Test & Company',
      address: '123 Main St #456',
      email: 'test+user@example.com'
    };

    await expect(submitViaGET(payload)).resolves.not.toThrow();
  });

  test('should timeout after 30 seconds', async () => {
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 40000))
    );

    await expect(submitViaGET({})).rejects.toThrow('逾時');
  });
});
```

#### 2.3 POST Submission Tests

```typescript
describe('submitViaPOST', () => {
  test('should successfully submit large data via POST', async () => {
    const payload = {
      quoteNumber: 'BS20251107001',
      signature: 'data:image/png;base64,' + 'A'.repeat(50000),
      stampFile: 'data:image/png;base64,' + 'B'.repeat(50000)
    };

    await expect(submitViaPOST(payload)).resolves.not.toThrow();
  });

  test('should send correct Content-Type header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await submitViaPOST({});

    const options = fetchSpy.mock.calls[0][1];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  test('should use CORS mode', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await submitViaPOST({});

    const options = fetchSpy.mock.calls[0][1];
    expect(options.mode).toBe('cors');
  });

  test('should properly stringify JSON body', async () => {
    const payload = {
      number: 123,
      boolean: true,
      string: 'test',
      array: [1, 2, 3]
    };

    const fetchSpy = jest.spyOn(global, 'fetch');

    await submitViaPOST(payload);

    const options = fetchSpy.mock.calls[0][1];
    const body = JSON.parse(options.body);

    expect(body.number).toBe(123);
    expect(body.boolean).toBe(true);
    expect(body.array).toEqual([1, 2, 3]);
  });
});
```

#### 2.4 Retry Logic Tests

```typescript
describe('Retry Mechanism', () => {
  test('should retry up to MAX_RETRIES times', async () => {
    let attempts = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      attempts++;
      return Promise.reject(new Error('Network error'));
    });

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(attempts).toBe(MAX_RETRIES);
    expect(result.success).toBe(false);
  });

  test('should succeed on second attempt', async () => {
    let attempts = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error('Transient error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'success' })
      });
    });

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(attempts).toBe(2);
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  test('should use exponential backoff', async () => {
    const delays = [];
    let lastTime = Date.now();

    global.fetch = jest.fn().mockImplementation(() => {
      const now = Date.now();
      if (delays.length > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      return Promise.reject(new Error('Network error'));
    });

    const data = createValidSubmissionData();
    await submitToGoogleSheets(data);

    // First retry: ~1s, Second retry: ~2s, Third retry: ~3s
    expect(delays[0]).toBeGreaterThan(900);
    expect(delays[1]).toBeGreaterThan(1900);
  });
});
```

---

### 3. End-to-End Tests

#### 3.1 Complete Submission Flow

```typescript
describe('Complete Submission Flow', () => {
  test('should submit company quote successfully', async () => {
    const data = {
      quoteNumber: generateQuoteNumber(),
      timestamp: new Date().toISOString(),
      formData: {
        customerType: 'company',
        companyName: 'Test Company Ltd.',
        taxId: '12345678',
        companyAddress: '台北市大安區測試路123號',
        website: 'https://test.com',
        contactName: '張三',
        phone: '0912345678',
        email: 'test@example.com',
        invoiceEmail: 'invoice@example.com',
        selectedPlan: 'plan2',
        addons: ['addon1'],
        multiStore: false,
        stampMethod: 'contact',
        agreeTerms: true
      },
      pricing: calculatePrice({
        selectedPlan: 'plan2',
        addons: ['addon1'],
        multiStore: false
      })
    };

    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(true);
    expect(result.quoteNumber).toBe(data.quoteNumber);
    expect(result.method).toMatch(/GET|POST/);
  });

  test('should submit individual quote successfully', async () => {
    const data = {
      quoteNumber: generateQuoteNumber(),
      timestamp: new Date().toISOString(),
      formData: {
        customerType: 'individual',
        individualName: '李四',
        companyAddress: '新北市板橋區測試街456號',
        contactName: '李四',
        phone: '0987654321',
        email: 'individual@example.com',
        invoiceEmail: 'individual@example.com',
        selectedPlan: 'plan1',
        addons: [],
        multiStore: false,
        stampMethod: 'signature',
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        agreeTerms: true
      },
      pricing: calculatePrice({
        selectedPlan: 'plan1',
        addons: [],
        multiStore: false
      })
    };

    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(true);
  });

  test('should handle large images with compression', async () => {
    const largeSignature = generateLargeBase64Image(2 * 1024 * 1024); // 2MB

    const data = {
      quoteNumber: generateQuoteNumber(),
      timestamp: new Date().toISOString(),
      formData: {
        // ... other fields
        signature: largeSignature,
        stampMethod: 'upload',
        stampFile: largeSignature
      },
      pricing: calculatePrice({
        selectedPlan: 'plan2',
        addons: [],
        multiStore: false
      })
    };

    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(true);
    expect(result.method).toBe('POST'); // Should use POST for large data
  });
});
```

---

### 4. Performance Tests

#### 4.1 Response Time Tests

```typescript
describe('Performance', () => {
  test('should complete submission within 5 seconds', async () => {
    const data = createValidSubmissionData();

    const startTime = Date.now();
    await submitToGoogleSheets(data);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });

  test('should compress large images within 2 seconds', async () => {
    const largeImage = generateLargeBase64Image(1024 * 1024); // 1MB

    const startTime = Date.now();
    await compressBase64Image(largeImage, 0.7);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });

  test('should handle concurrent submissions', async () => {
    const submissions = Array(5).fill(null).map((_, i) => {
      return submitToGoogleSheets({
        quoteNumber: `BS00${i}`,
        // ... other data
      });
    });

    const results = await Promise.all(submissions);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

#### 4.2 Memory Usage Tests

```typescript
describe('Memory Usage', () => {
  test('should not leak memory on multiple submissions', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    for (let i = 0; i < 10; i++) {
      await submitToGoogleSheets(createValidSubmissionData());
    }

    // Force garbage collection if available
    if (global.gc) global.gc();

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

### 5. Edge Case Tests

#### 5.1 Boundary Conditions

```typescript
describe('Edge Cases', () => {
  test('should handle URL exactly at MAX_URL_LENGTH', () => {
    const payload = generatePayloadWithUrlLength(MAX_URL_LENGTH);
    const method = decideSubmissionMethod(payload);

    expect(method).toBe('GET'); // Should still use GET
  });

  test('should handle URL one character over MAX_URL_LENGTH', () => {
    const payload = generatePayloadWithUrlLength(MAX_URL_LENGTH + 1);
    const method = decideSubmissionMethod(payload);

    expect(method).toBe('POST'); // Should switch to POST
  });

  test('should handle empty strings in optional fields', async () => {
    const data = {
      // ... required fields
      website: '',
      taxId: '',
      driveFolder: ''
    };

    await expect(submitToGoogleSheets(data)).resolves.not.toThrow();
  });

  test('should handle unicode characters', async () => {
    const data = {
      companyName: '測試公司有限公司',
      address: '台北市中正區重慶南路一段122號',
      contactName: '王小明',
      // ... other fields with Chinese characters
    };

    const result = await submitToGoogleSheets(data);
    expect(result.success).toBe(true);
  });

  test('should handle special characters that need URL encoding', async () => {
    const data = {
      companyName: 'Test & Co.',
      address: '123 Main St. #456',
      email: 'test+user@example.com',
      website: 'https://example.com?param=value&other=value'
    };

    const result = await submitToGoogleSheets(data);
    expect(result.success).toBe(true);
  });
});
```

#### 5.2 Error Scenarios

```typescript
describe('Error Scenarios', () => {
  test('should handle malformed JSON response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve('not valid JSON')
    });

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(false);
  });

  test('should handle missing status in response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Done' }) // No status field
    });

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(false);
  });

  test('should handle Apps Script returning error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'error',
        message: 'Script execution failed'
      })
    });

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Script execution failed');
  });

  test('should handle CORS errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(
      new Error('CORS policy blocked the request')
    );

    const data = createValidSubmissionData();
    const result = await submitToGoogleSheets(data);

    expect(result.success).toBe(false);
    expect(result.message).toContain('CORS');
  });
});
```

---

## 🔧 Manual Testing Checklist

### Pre-deployment Testing

- [ ] **Connection Test**
  - Open browser console
  - Run `testConnection()`
  - Verify returns `true`
  - Check for `{"status":"ok"}` response

- [ ] **Small Data Submission (GET)**
  - Submit quote without images
  - Check browser Network tab
  - Verify GET request used
  - Confirm data appears in Google Sheets
  - Verify all fields populated correctly

- [ ] **Large Data Submission (POST)**
  - Submit quote with large signature (>1MB)
  - Check browser Network tab
  - Verify POST request used
  - Confirm image compression occurred
  - Verify data appears in Google Sheets

- [ ] **Error Handling**
  - Temporarily break Apps Script URL
  - Submit form
  - Verify user-friendly error message
  - Check retry attempts in console
  - Verify no data corruption

- [ ] **Network Simulation**
  - Use Chrome DevTools Network throttling
  - Set to "Slow 3G"
  - Submit form
  - Verify timeout handling
  - Check retry mechanism

### Cross-browser Testing

- [ ] **Chrome** (latest)
  - All features working
  - Console logs correct
  - No errors

- [ ] **Firefox** (latest)
  - All features working
  - CORS handling correct
  - No errors

- [ ] **Safari** (latest)
  - All features working
  - Fetch API compatible
  - No errors

- [ ] **Edge** (latest)
  - All features working
  - No compatibility issues
  - No errors

### Mobile Testing

- [ ] **iOS Safari**
  - Form submission works
  - Image capture/upload works
  - Performance acceptable

- [ ] **Android Chrome**
  - Form submission works
  - Image capture/upload works
  - Performance acceptable

---

## 📊 Test Data Fixtures

```typescript
// Helper functions to generate test data

function createValidSubmissionData(): SubmissionData {
  return {
    quoteNumber: generateQuoteNumber(),
    timestamp: new Date().toISOString(),
    formData: {
      customerType: 'company',
      companyName: 'Test Company Ltd.',
      taxId: '12345678',
      companyAddress: '台北市測試路123號',
      contactName: '張三',
      phone: '0912345678',
      email: 'test@example.com',
      invoiceEmail: 'invoice@example.com',
      selectedPlan: 'plan2',
      addons: [],
      multiStore: false,
      stampMethod: 'contact',
      agreeTerms: true
    },
    pricing: {
      planPrice: 9000,
      addonPrice: 0,
      multiStorePrice: 0,
      totalPrice: 9000
    }
  };
}

function generateLargeBase64Image(size: number): string {
  // Generate a base64 string of approximately 'size' bytes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = 'data:image/png;base64,';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePayloadWithUrlLength(targetLength: number): Record<string, any> {
  const basePayload = {
    quoteNumber: 'BS001',
    timestamp: new Date().toISOString()
  };

  // Calculate how much padding needed
  const baseUrl = `${SCRIPT_URL}?${new URLSearchParams(basePayload).toString()}`;
  const paddingNeeded = targetLength - baseUrl.length;

  if (paddingNeeded > 0) {
    basePayload['padding'] = 'X'.repeat(paddingNeeded);
  }

  return basePayload;
}
```

---

## 🎯 Success Criteria

### All tests must pass with:

✅ **100% Pass Rate** for unit tests
✅ **100% Pass Rate** for integration tests
✅ **95%+ Pass Rate** for E2E tests (allowing for network flakiness)
✅ **No console errors** during manual testing
✅ **Response time < 5 seconds** for 95th percentile
✅ **Success rate > 99%** for valid submissions
✅ **Graceful degradation** for network issues

---

## 🚀 Running the Tests

### Setup

```bash
# Install dependencies
npm install --save-dev jest @types/jest ts-jest

# Configure Jest
npx ts-jest config:init
```

### Execute

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- googleSheets-bolt-final

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Google Sheets Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 📝 Test Report Template

```markdown
# Test Execution Report

**Date**: YYYY-MM-DD
**Version**: 2.0.0
**Tester**: [Name]

## Summary

- Total Tests: 87
- Passed: 85
- Failed: 2
- Skipped: 0
- Duration: 45.2s

## Failed Tests

1. **Test Name**: should handle concurrent submissions
   - **Error**: Timeout after 30s
   - **Root Cause**: Google Apps Script rate limiting
   - **Action**: Add rate limiting to test

2. **Test Name**: should complete submission within 5 seconds
   - **Error**: Took 6.2s
   - **Root Cause**: Large image compression slow
   - **Action**: Optimize compression algorithm

## Performance Metrics

- Average response time: 2.3s
- 95th percentile: 4.8s
- Success rate: 99.2%
- Retry rate: 3.5%

## Recommendations

1. Optimize image compression
2. Add request queuing for concurrent submissions
3. Implement caching for repeated submissions

## Sign-off

- [ ] All critical tests passing
- [ ] Performance acceptable
- [ ] Ready for deployment

**Signature**: _____________
```

---

## 🎉 Conclusion

This comprehensive testing strategy ensures the Google Sheets integration is:

- **Robust**: Handles errors gracefully
- **Reliable**: Retries transient failures
- **Performant**: Completes quickly
- **User-friendly**: Provides helpful feedback
- **Maintainable**: Well-tested and documented

Follow this strategy to validate all changes before deployment!
