import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import React from 'react'
import { cleanup } from '@testing-library/react'

const globalAfterEach = (globalThis as { afterEach?: (fn: () => void) => void }).afterEach
if (typeof globalAfterEach === 'function') {
	globalAfterEach(() => {
		cleanup()
	})
}

// Ensure React is available globally when running JSX in Vitest
// Vitest uses esbuild which leverages the automatic runtime.
// Assigning here prevents runtime ReferenceError in legacy transformed code.
const globalWithReact = globalThis as unknown as { React: typeof React }
globalWithReact.React = React

// Minimal ResizeObserver polyfill for charting components during tests
if (typeof globalThis.ResizeObserver === 'undefined') {
	class ResizeObserver {
		private readonly callback: ResizeObserverCallback

		constructor(callback: ResizeObserverCallback) {
			this.callback = callback
		}

		observe(target: Element): void {
			const entry = {
				target,
				contentRect: {
					width: 800,
					height: 600,
					top: 0,
					right: 800,
					bottom: 600,
					left: 0
				}
			} as unknown as ResizeObserverEntry
			this.callback([entry], this)
		}

		unobserve(): void {}
		disconnect(): void {}
	}

	const globalWithResizeObserver = globalThis as unknown as {
		ResizeObserver: typeof ResizeObserver
	}
	globalWithResizeObserver.ResizeObserver = ResizeObserver
}

// Minimal IntersectionObserver polyfill for Radix components during tests
if (typeof globalThis.IntersectionObserver === 'undefined') {
	class IntersectionObserver {
		constructor(callback: IntersectionObserverCallback) {
			void callback
		}
		observe(): void {}
		unobserve(): void {}
		disconnect(): void {}
	}

	const globalWithIntersectionObserver = globalThis as unknown as {
		IntersectionObserver: typeof IntersectionObserver
	}
	globalWithIntersectionObserver.IntersectionObserver = IntersectionObserver
}

// Ensure scrollIntoView exists for Radix components triggering focus management
if (typeof HTMLElement !== 'undefined') {
	HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock(): void {
		// Intentionally left blank; jsdom doesn't implement layout/scrolling.
	}
}