
const { loadDeputiesCache } = require('./src/app/monitor/actions/_cached-loaders');
const { parseDeputiesCache } = require('./src/services/analytics');

async function checkDeputado() {
    try {
        const rawData = await loadDeputiesCache();
        // Mocking parseDeputiesCache behavior if it's not easily importable or if it relies on other things
        // But let's try to inspect rawData first.

        let deputados = [];
        if (rawData && rawData.deputados) {
            deputados = rawData.deputados;
        } else if (Array.isArray(rawData)) {
            deputados = rawData;
        }

        console.log(`Total deputados found: ${deputados.length}`);

        const targetId = '220538';
        const found = deputados.find(d => String(d.id) === targetId);

        if (found) {
            console.log('Deputado FOUND:', found.nomeEleitoral || found.nome);
        } else {
            console.log('Deputado NOT FOUND');
            // List some IDs to verify format
            console.log('First 5 IDs:', deputados.slice(0, 5).map(d => d.id));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDeputado();
