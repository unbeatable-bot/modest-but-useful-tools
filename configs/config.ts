import common from "./common";
import local from "./local";
import dev from "./dev";
import prod from "./prod";

import { readFileSync } from "fs";
import * as yaml from 'js-yaml';

const phase = process.env.NODE_ENV;

let conf = {};
if (phase === 'local') {
    conf = local;
} else if (phase === 'dev') {
    conf = dev;
} else if (phase === 'pord') {
    conf = prod;
}

const yamlConfig: Record<string, any> = yaml.load(
    readFileSync(`${process.cwd()}/envs/config.yaml`, 'utf-8'),
);

export default () => ({
    ...common,
    ...conf,
    ...yamlConfig,
});