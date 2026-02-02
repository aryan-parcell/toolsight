import * as setup from './suites/01-setup';
import * as inventory from './suites/02-inventory';
import * as checkouts from './suites/03-checkouts';
import * as audits from './suites/04-audits';
import * as exploits from './suites/05-exploits';
import * as cleanup from './suites/06-cleanup';
import { loadState } from './helpers';

const runAll = async () => {
    try {
        // Run sequentially
        await setup.run();

        // Reload state in case setup modified it (if running via file persistence)
        loadState();

        await inventory.run();
        await checkouts.run();
        await audits.run();
        await exploits.run();

    } catch (e) {
        console.error("\n🛑 TEST SUITE CRASHED:", e);
    } finally {
        // Always run cleanup
        await cleanup.run();
    }
};

runAll();