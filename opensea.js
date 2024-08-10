import fs from 'fs/promises';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';
import opensea from '@api/opensea';

opensea.auth('749bee384e694213bf01b2f8fe2acabc');
opensea.server('https://api.opensea.io');

// Конфигурация для записи CSV
const csvWriterInstance = csvWriter({
    path: 'opensea.csv',
    header: [
        { id: 'address', title: 'Address' },
        { id: 'total_nfts', title: 'Total NFTs' }
    ]
});

// Функция для ожидания
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функция для получения списка NFT с лимитом 200
const fetchNFTs = async (address) => {
    let offset = 0;
    let totalNFTs = 0;
    let hasMore = true;

    while (hasMore) {
        try {
            console.log(`Запрашиваю NFT для адреса ${address} с оффсетом ${offset}`);
            const response = await opensea.list_nfts_by_account({ chain: 'ethereum', address, limit: 200, offset });
            const { nfts } = response.data;
            totalNFTs += nfts.length;
            offset += nfts.length;
            hasMore = nfts.length === 200;

            // Пауза на 1 секунду между запросами
            await sleep(1000);
        } catch (error) {
            console.error(`Ошибка при получении данных для адреса ${address}:`, error);
            hasMore = false;
        }
    }

    return totalNFTs;
};

// Основная функция для обработки всех адресов
const processAddresses = async () => {
    try {
        const addresses = (await fs.readFile('addresses.txt', 'utf-8')).split('\n').filter(Boolean);
        const results = [];

        for (const address of addresses) {
            const totalNFTs = await fetchNFTs(address);
            results.push({ address, total_nfts: totalNFTs });
        }

        await csvWriterInstance.writeRecords(results);
        console.log('Данные успешно записаны в opensea.csv');
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
};

// Запуск основной функции
processAddresses();
