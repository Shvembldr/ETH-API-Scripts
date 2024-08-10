import { Alchemy, Network } from "alchemy-sdk";
import fs from 'fs/promises';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';

const config = {
    apiKey: "3R8kJ8wClcUroMIoHIdmYKX2_OImRp5_",
    network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

// Функция для задержки
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getNftCountForAddress = async (address) => {
    try {
        const nfts = await alchemy.nft.getNftsForOwner(address);
        return {
            address: address,
            totalNfts: nfts.totalCount
        };
    } catch (error) {
        console.error(`Error fetching NFTs for address ${address}:`, error);
        return {
            address: address,
            totalNfts: 'Error'
        };
    }
};

const processAddresses = async () => {
    try {
        const data = await fs.readFile('addresses.txt', 'utf-8');
        const addresses = data.split('\n').filter(Boolean);

        const csv = csvWriter({
            path: 'results2.csv',
            header: [
                { id: 'address', title: 'Address' },
                { id: 'totalNfts', title: 'Total NFTs' }
            ]
        });

        const results = [];
        for (const address of addresses) {
            const info = await getNftCountForAddress(address);
            results.push(info);

            // Задержка в 2 секунды между запросами
            await delay(2000);
        }

        await csv.writeRecords(results);
        console.log('CSV file successfully written.');
    } catch (error) {
        console.error('Error processing addresses:', error);
    }
};

processAddresses();
