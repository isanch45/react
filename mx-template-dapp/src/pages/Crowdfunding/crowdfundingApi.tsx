import { useGetNetworkConfig } from 'hooks';
import {
  Address,
  AddressValue,
  ContractFunction,
  ProxyNetworkProvider,
  ResultsParser
} from 'utils';
import { abi, smartContract } from './crowdfundingSmartContract';
import { useEffect, useState } from 'react';
import {
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig
} from '@multiversx/sdk-core/out';
import { crowdfundingContractAddress } from 'config';
import { signAndSendTransactions } from 'helpers';

const resultsParser = new ResultsParser();

const PONG_TRANSACTION_INFO = {
  processingMessage: 'Fent un dipòsit',
  errorMessage: 'Error en fer el dipòsit',
  successMessage: 'Dipòsit realitzat correctament'
};

export const useCrowdfuningContract = (
  userAddress: string,
  balance: string
) => {
  const { network } = useGetNetworkConfig();
  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const [targetAmount, setTargetAmount] = useState<BigInt>(BigInt(0));
  const [currentFunds, setCurrentFunds] = useState<BigInt>(BigInt(0));
  const [deadline, setDeadline] = useState<string>('');
  const [userDeposit, setUserDeposit] = useState<BigInt>(BigInt(0));

  const [minDeposit, setMinDeposit] = useState<BigInt>(BigInt(0));
  const [maxPerWallet, setMaxPerWallet] = useState<BigInt>(BigInt(0));
  const [maxTotalProject, setMaxTotalProject] = useState<BigInt>(BigInt(0));
  const [ownerAddress, setOwnerAddress] = useState<string>('');

  const queryValue = async (funcName: string, args = []) => {
    try {
      const query = smartContract.createQuery({
        func: new ContractFunction(funcName),
        args
      });
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = smartContract.getEndpoint(funcName);
      const { firstValue } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );
      return firstValue?.valueOf();
    } catch (err) {
      console.error(`Unable to call ${funcName}`, err);
      return BigInt(0);
    }
  };

  const getTargetAmount = async () => setTargetAmount(await queryValue('getTarget'));
  const getCurrentFunds = async () => setCurrentFunds(await queryValue('getCurrentFunds'));
  const getDeadline = async () => {
    const val = await queryValue('getDeadline');
    setDeadline(val?.toFixed?.() || '');
  };
  const getUserDeposit = async () => {
    if (!userAddress) return;
    const val = await queryValue('getDeposit', [new AddressValue(new Address(userAddress))]);
    setUserDeposit(val);
  };

  const getMinDeposit = async () => setMinDeposit(await queryValue('getMinDepositPerTx'));
  const getMaxPerWallet = async () => setMaxPerWallet(await queryValue('getMaxTotalPerWallet'));
  const getMaxTotalProject = async () => setMaxTotalProject(await queryValue('getMaxTotalProject'));

  const getOwnerAddress = async () => {
    try {
      const val = await queryValue('getOwneraddress');
      console.log('📦 Valor retornat per getOwneraddress():', val);
      const addr = val.toString();
      console.log('✅ Adreça decodificada:', addr);
      setOwnerAddress(addr);
    } catch (err) {
      console.error('❌ Error decoding owner address:', err);
      setOwnerAddress('');
    }
  };

  const doDeposit = async (amount: BigInt) => {
    if (!userAddress) {
      console.error('No user address');
      return;
    }

    const factoryConfig = new TransactionsFactoryConfig({
      chainID: network.chainId
    });

    const factory = new SmartContractTransactionsFactory({
      config: factoryConfig,
      abi
    });

    const transaction = factory.createTransactionForExecute({
      sender: new Address(userAddress),
      contract: new Address(crowdfundingContractAddress),
      function: 'fund',
      gasLimit: BigInt(10000000),
      arguments: [],
      nativeTransferAmount: amount.valueOf()
    });

    await signAndSendTransactions({
      transactions: [transaction],
      callbackRoute: '',
      transactionsDisplayInfo: PONG_TRANSACTION_INFO
    });
  };


  const updateMinDeposit = async (newMin: BigInt) => {
    if (!userAddress) return;

    const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
    const factory = new SmartContractTransactionsFactory({ config: factoryConfig, abi });

    const transaction = factory.createTransactionForExecute({
      sender: new Address(userAddress),
      contract: new Address(crowdfundingContractAddress),
      function: 'setMinDepositPerTx',
      gasLimit: BigInt(10000000),
      arguments: [newMin],
      nativeTransferAmount: 0n
    });

    await signAndSendTransactions({
      transactions: [transaction],
      callbackRoute: '',
      transactionsDisplayInfo: {
        processingMessage: 'Actualitzant mínim',
        errorMessage: 'Error en actualitzar el mínim',
        successMessage: 'Mínim actualitzat correctament'
      }
    });

    getMinDeposit();
  };

 const updateMaxPerWallet = async (newMax: BigInt) => {
  if (!userAddress) return;

  const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
  const factory = new SmartContractTransactionsFactory({ config: factoryConfig, abi });

  const transaction = factory.createTransactionForExecute({
    sender: new Address(userAddress),
    contract: new Address(crowdfundingContractAddress),
    function: 'setMaxTotalPerWallet',
    gasLimit: BigInt(10000000),
    arguments: [newMax],
    nativeTransferAmount: 0n
  });

  await signAndSendTransactions({
    transactions: [transaction],
    callbackRoute: '',
    transactionsDisplayInfo: {
      processingMessage: 'Actualitzant màxim',
      errorMessage: 'Error en actualitzar el màxim',
      successMessage: 'Màxim actualitzat correctament'
    }
  });

  getMaxPerWallet();
};

const updateMaxTotalProject = async (newMax: BigInt) => {
  if (!userAddress) return;

  const factoryConfig = new TransactionsFactoryConfig({ chainID: network.chainId });
  const factory = new SmartContractTransactionsFactory({ config: factoryConfig, abi });

  const transaction = factory.createTransactionForExecute({
    sender: new Address(userAddress),
    contract: new Address(crowdfundingContractAddress),
    function: 'setMaxTotalProject', // Nom correcte del contracte
    gasLimit: BigInt(10000000),
    arguments: [newMax],
    nativeTransferAmount: 0n
  });

  await signAndSendTransactions({
    transactions: [transaction],
    callbackRoute: '',
    transactionsDisplayInfo: {
      processingMessage: 'Actualitzant màxim del projecte',
      errorMessage: 'Error en actualitzar el màxim del projecte',
      successMessage: 'Màxim del projecte actualitzat correctament'
    }
  });

  getMaxTotalProject();
};


  useEffect(() => {
    getTargetAmount();
    getCurrentFunds();
    getDeadline();
    getUserDeposit();
    getMinDeposit();
    getMaxPerWallet();
    getMaxTotalProject();
    getOwnerAddress();
  }, [balance]);

  return {
    targetAmount,
    currentFunds,
    deadline,
    userDeposit,
    doDeposit,
    minDeposit,
    maxPerWallet,
    maxTotalProject,
    ownerAddress,
    updateMinDeposit,
    updateMaxPerWallet,
    updateMaxTotalProject,
    contractAddress: crowdfundingContractAddress
  };
};
