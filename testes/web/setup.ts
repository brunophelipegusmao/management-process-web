/**
 * Angular test setup for standalone Vitest execution.
 *
 * @angular/compiler is required so that TestBed can compile component metadata
 * at runtime (JIT mode). Without this import, TestBed.configureTestingModule
 * will throw for components — although pure service / store tests that never
 * touch templates can skip it.
 *
 * If zone.js is not installed in the workspace, enable zoneless mode in each
 * TestBed call via provideExperimentalZonelessChangeDetection() (already done
 * in all guard and service spec files in this suite).
 */
import '@angular/compiler';
