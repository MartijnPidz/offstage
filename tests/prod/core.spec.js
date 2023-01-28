import esbuild from 'esbuild';
import { test, expect } from '@playwright/test';

import { prepareProject }  from '../utils/prepare-project.js';
import { createServer }  from '../utils/create-server.js';

const defaultApp = {
  'src/app.ts': `
    import { configure } from 'offstage/core';
    import { mathService } from './math-service';
    configure([
      () => ({ baseURL:'http://localhost:3000' })
    ]);
    console.log(await mathService.sum({ a:1, b:2 }));
  `,
};

test('calling a GET endpoint makes a request', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('GET /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('GET');
  expect(lastRequest.url).toBe('/sum?a=1&b=2');
});

test('calling a GET endpoint makes a request with 1 param', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('GET /sum/:a', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('GET');
  expect(lastRequest.url).toBe('/sum/1?b=2');
});

test('calling a GET endpoint makes a request with 2 params', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('GET /sum/:a/:b', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  await buildAndRun({ prod: true });

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('GET');
  expect(lastRequest.url).toBe('/sum/1/2');
});

test('calling a POST endpoint makes a request', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('POST /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('POST');
  expect(lastRequest.url).toBe('/sum');
  expect(lastRequest.bodyJSON).toEqual({ a:1, b:2 });
});

test('calling a PATCH endpoint makes a request', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('PATCH /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('PATCH');
  expect(lastRequest.url).toBe('/sum');
  expect(lastRequest.bodyJSON).toEqual({ a:1, b:2 });
});

test('calling a PUT endpoint makes a request', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('PUT /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('PUT');
  expect(lastRequest.url).toBe('/sum');
  expect(lastRequest.bodyJSON).toEqual({ a:1, b:2 });
});

test('calling a DELETE endpoint makes a request', async() => {
  const { buildAndRun } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('DELETE /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((req, res) => res.end('4'));
  const { stdout } = await buildAndRun({ prod: true });
  expect(stdout.split('\n')).toContain('4');

  const { lastRequest } = state;
  expect(lastRequest.method).toBe('DELETE');
  expect(lastRequest.url).toBe('/sum');
  expect(lastRequest.bodyJSON).toEqual({ a:1, b:2 });
});

test('can properly merge configurations', async() => {
  const { buildAndRun } = await prepareProject({
    'src/app.ts': `
      import { configure } from 'offstage/core';
      import { mathService } from './math-service';
      configure([
        () => ({ baseURL:'http://localhost:3000' }),
        () => ({ headers: { Authorization: 'Bearer foo' } }),
        () => ({ headers: { 'x-foo-bar': 'Bar' } }),
      ]);
      console.log(await mathService.sum({ a:1, b:2 }));
    `,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('DELETE /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((_, res) => res.end('4'));
  await buildAndRun({ prod: true });

  const { lastRequest } = state;
  const headers = lastRequest.headers;
  expect(headers.authorization).toBe('Bearer foo');
  expect(headers['x-foo-bar']).toBe('Bar');
});

test('can supply options at method invocation', async() => {
  const { buildAndRun } = await prepareProject({
    'src/app.ts': `
      import { configure } from 'offstage/core';
      import { mathService } from './math-service';
      configure([
        () => ({ baseURL:'http://localhost:3000' }),
      ]);
      console.log(await mathService.sum({ a:1, b:2 }, {
        headers: {
          'x-foo-bar': 'Foo',
        }
      }));
    `,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('DELETE /sum', ({ a, b }) => a + b)
      })
    `
  });
  const state = await createServer((_, res) => res.end('4'));
  await buildAndRun({ prod: true });

  const { lastRequest } = state;
  const headers = lastRequest.headers;
  expect(headers['x-foo-bar']).toBe('Foo');
});

test('factory works', async() => {
  const { factory } = await import(process.cwd() + '/dist/mjs/core.js');
  const makeUser = factory({
    email: 'user@company.org',
    firstname: 'John',
    lastname: 'Doe',
    birthdate: '1990-01-01'
  });

  expect(makeUser()).toEqual({
    email: 'user@company.org',
    firstname: 'John',
    lastname: 'Doe',
    birthdate: '1990-01-01'
  });

  expect(makeUser({ birthdate: '2022-01-01' })).toEqual({
    email: 'user@company.org',
    firstname: 'John',
    lastname: 'Doe',
    birthdate: '2022-01-01',
  });
});

test('minified takes less than 5kb', async() => {
  const { dir } = await prepareProject({
    ...defaultApp,
    'src/math-service.ts': `
      import { service, endpoint } from 'offstage/core';
      export const { mathService } = service({
        sum: endpoint<
          {a:number, b:number},
          number
        >('DELETE /sum', ({ a, b }) => a + b)
      })
    `
  });

  const result = esbuild.buildSync({
    entryPoints: [ 'src/app.ts' ],
    format: 'esm',
    absWorkingDir: dir,
    bundle: true,
    minify: true,
    write: false,
    outfile: 'app.js',
  });
  const total = result.outputFiles[0].text.length;
  expect(total).toBeLessThan(5 * 1024);
});

  // test.skip('Error is triggered when status code bigger than 300', async ({ page }) => {
  //   const promise = singleServerRequest(
  //     (req) => req.url.includes('/foo'),
  //     (_,res) => {
  //       res.statusCode = 422;
  //       return { error:'Could not square input' };
  //     }
  //   );
  //   await page.goto('/');
  //   await page.click('"config baseURL"');
  //   await promise;
  //   await expect(page.locator('"Could not square input"')).toBeVisible();
  // });
