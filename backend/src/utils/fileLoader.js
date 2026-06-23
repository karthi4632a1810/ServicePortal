import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';

export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function loadConfigFile(filename) {
  return readJsonFile(path.join(config.paths.config, filename));
}

export async function listFormFiles() {
  const formsDir = config.paths.forms;
  const departments = await fs.readdir(formsDir, { withFileTypes: true });
  const files = [];

  for (const dept of departments) {
    if (!dept.isDirectory()) continue;
    const deptPath = path.join(formsDir, dept.name);
    const jsonFiles = await fs.readdir(deptPath);
    for (const file of jsonFiles) {
      if (file.endsWith('.json')) {
        files.push({
          department: dept.name,
          filename: file,
          filepath: path.join(deptPath, file),
        });
      }
    }
  }
  return files;
}

export async function loadFormJson(relativePath) {
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(config.paths.forms, relativePath);
  return readJsonFile(fullPath);
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
