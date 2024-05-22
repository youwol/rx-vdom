import { Config } from 'jest'

const jestConfig: Config = {
    preset: '@youwol/jest-preset',
    modulePathIgnorePatterns: [],
    testPathIgnorePatterns: ['rx-vdom-doc'],
}
export default jestConfig
