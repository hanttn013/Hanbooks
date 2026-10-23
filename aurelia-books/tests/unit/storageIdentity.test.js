import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { StorageManager } from '../../src/utils/StorageManager';

function readProjectFile(relativePath) {
  return readFileSync(`${process.cwd()}/${relativePath}`, 'utf8');
}

describe('installed storage identity', () => {
  it('keeps the existing IndexedDB name and schema version', async () => {
    const db = await StorageManager.openDB();

    expect(db.name).toBe('aurelia_db');
    expect(db.version).toBe(4);
    db.close();
  });

  it('keeps the existing Android application id in web and native config', () => {
    const capacitorConfig = JSON.parse(readProjectFile('capacitor.config.json'));
    const androidGradle = readProjectFile('android/app/build.gradle');
    const androidStrings = readProjectFile('android/app/src/main/res/values/strings.xml');

    expect(capacitorConfig.appId).toBe('com.aurelia.books');
    expect(androidGradle).toContain('namespace = "com.aurelia.books"');
    expect(androidGradle).toContain('applicationId "com.aurelia.books"');
    expect(androidStrings).toContain('<string name="package_name">com.aurelia.books</string>');
    expect(androidStrings).toContain('<string name="custom_url_scheme">com.aurelia.books</string>');
  });
});
