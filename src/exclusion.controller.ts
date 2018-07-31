import { Project } from './project.model';
import { writeJson, existsSync, readJsonSync } from 'fs-extra';
import { FILES_EXCLUDE } from './constants';
import { workspace } from 'vscode';

export class ExclusionController {

    updateExclusions(projects: Project[]): void {
        const exclusions = projects.map(p => this.analyseExcluded(p));
        const patterns = this.mergePatterns(exclusions);
        const allPatterns = this.addDependencies(patterns);
        const settings = this.updateSettings(allPatterns);
        writeJson(this.settingsPath, settings);
    }

    private addDependencies(patterns: { [key: string]: boolean }): { [key: string]: object | boolean } {
        const additionalPatterns: { [key: string]: object | boolean } = {};
        const whenCondition = { 'when': '$(basename).ts' };
        Object.keys(patterns).forEach(p => {
            additionalPatterns[p] = true;
            if (p.indexOf('.ts') !== -1) {
                const html = p.replace('.ts', '.html');
                const scss = p.replace('.ts', '.scss');
                additionalPatterns[html] = whenCondition;
                additionalPatterns[scss] = whenCondition;
            }
        });
        return additionalPatterns;
    }

    private analyseExcluded(project: Project): string[] {
        const path = project.config.slice(1);
        const tsSettings = readJsonSync(path);
        return tsSettings.exclude || [];
    }

    private updateSettings(patterns: { [key: string]: boolean | object }): { [key: string]: any } {
        const settings = this.getCurrentSettings();
        settings[FILES_EXCLUDE] = patterns;
        return settings;
    }

    private getCurrentSettings(): { [key: string]: any } {
        if (existsSync(this.settingsPath)) {
            return readJsonSync(this.settingsPath);
        } else {

        }
        return {};
    }

    private mergePatterns(newPatterns: string[][]): { [key: string]: boolean } {
        const result: { [key: string]: boolean } = {};
        if (newPatterns && newPatterns.length > 0) {
            let intersection = newPatterns[0];
            for (let i = 1; i < newPatterns.length; i++) {
                intersection = intersection.filter(v => newPatterns[i].indexOf(v) !== -1);
            }
            intersection.forEach(p => result[p] = true);
        }
        return result;
    }

    private get settingsPath(): string {
        return `${workspace.rootPath}\\.vscode\\settings.json`;
    }
}