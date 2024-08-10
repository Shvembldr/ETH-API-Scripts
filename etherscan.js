import axios from 'axios';
import fs from 'fs/promises';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';

const apiKey = '46UXWTFIYQ95XM67S6D8JMYMPNSW2W3EA1'; // Замените на ваш Etherscan API ключ

async function getAllTransactions(address) {
    let transactions = [];
    let startblock = 0;
    const endblock = 99999999;
    const sort = 'asc';
    let moreTransactions = true;

    while (moreTransactions) {
        try {
            const response = await axios.get(`https://api.etherscan.io/api`, {
                params: {
                    module: 'account',
                    action: 'txlist',
                    address: address,
                    startblock: startblock,
                    endblock: endblock,
                    sort: sort,
                    apikey: apiKey
                }
            });

            const newTransactions = response.data.result;
            transactions = transactions.concat(newTransactions);

            if (newTransactions.length < 10000) {
                moreTransactions = false;
            } else {
                startblock = Number(newTransactions[newTransactions.length - 1].blockNumber) + 1;
            }
        } catch (error) {
            console.error(`Error fetching transactions for address ${address}:`, error);
            moreTransactions = false;
        }
    }

    return transactions;
}

async function getWalletInfo(address) {
    const transactions = await getAllTransactions(address);
    const transactionCount = transactions.length;

    let firstTransactionDate = null;
    let lastTransactionDate = null;

    if (transactionCount > 0) {
        const firstTransaction = transactions[0];
        const lastTransaction = transactions[transactionCount - 1];
        const firstTimeStamp = Number(firstTransaction.timeStamp);
        const lastTimeStamp = Number(lastTransaction.timeStamp);
        if (!isNaN(firstTimeStamp) && firstTimeStamp > 0) {
            firstTransactionDate = new Date(firstTimeStamp * 1000);
        }
        if (!isNaN(lastTimeStamp) && lastTimeStamp > 0) {
            lastTransactionDate = new Date(lastTimeStamp * 1000);
        }
    }

    return {
        address: address,
        transactionCount: transactionCount,
        firstTransactionDate: firstTransactionDate ? firstTransactionDate.toISOString() : 'N/A',
        lastTransactionDate: lastTransactionDate ? lastTransactionDate.toISOString() : 'N/A'
    };
}

async function processAddresses() {
    try {
        const data = await fs.readFile('addresses.txt', 'utf-8');
        const addresses = data.split('\n').filter(Boolean);

        const csv = csvWriter({
            path: 'result.csv',
            header: [
                { id: 'address', title: 'Address' },
                { id: 'transactionCount', title: 'Total Transactions' },
                { id: 'firstTransactionDate', title: 'First Transaction Date' },
                { id: 'lastTransactionDate', title: 'Last Transaction Date' }
            ]
        });

        const results = [];
        for (const address of addresses) {
            console.log(`Processing address: ${address}`);
            const info = await getWalletInfo(address);
            if (info) {
                results.push(info);
            }
        }

        await csv.writeRecords(results);
        console.log('CSV file successfully written.');
    } catch (error) {
        console.error('Error processing addresses:', error);
    }
}

processAddresses();
