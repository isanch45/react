import { OutputContainer } from 'components';
import { useCrowdfuningContract } from './crowdfundingApi';
import { formatAmount } from 'utils/sdkDappUtils';
import { formatDate } from './utils';
import { useGetAccount } from 'hooks';
import { useState } from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import BigNumber from 'bignumber.js';

export const Crowdfunding = () => {
  const { address, balance } = useGetAccount();
  const {
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
    contractAddress,
  } = useCrowdfuningContract(address, balance);

  const [depositAmount, setDepositAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newMin, setNewMin] = useState('');
  const [newMax, setNewMax] = useState('');
  const [newMaxTotal, setNewMaxTotal] = useState('');

  const now = Math.floor(Date.now() / 1000);
  const isAfterDeadline = deadline && now > parseInt(deadline);

 const handleSetMaxTotal = () => {
  if (!newMaxTotal || isNaN(parseFloat(newMaxTotal))) return;
  const amountInWei = new BigNumber(newMaxTotal).multipliedBy(1e18);
  updateMaxTotalProject(BigInt(amountInWei.toFixed(0)));
  setNewMaxTotal('');
};
const target = new BigNumber(targetAmount.toString());
const current = new BigNumber(currentFunds.toString());
const progressFundingPercent = target.gt(0)
  ? current.dividedBy(target).multipliedBy(100).toNumber()
  : 0;


  const handleSetMinDeposit = () => {
    if (!newMin || isNaN(parseFloat(newMin))) return;
    const amountInWei = new BigNumber(newMin).multipliedBy(1e18);
    updateMinDeposit(BigInt(amountInWei.toFixed(0)));
    setNewMin('');
  };

  const handleSetMaxPerWallet = () => {
    if (!newMax || isNaN(parseFloat(newMax))) return;
    const amountInWei = new BigNumber(newMax).multipliedBy(1e18);
    updateMaxPerWallet(BigInt(amountInWei.toFixed(0)));
    setNewMax('');
  };

  const handleDeposit = () => {
    setErrorMessage('');
    if (!depositAmount || isNaN(parseFloat(depositAmount))) return;
    const amount = new BigNumber(depositAmount);
    const amountInWei = amount.multipliedBy(new BigNumber(10).pow(18));

    if (new BigNumber(minDeposit.toString()).gt(0) && amountInWei.lt(minDeposit.toString())) {
      setErrorMessage('La quantitat és inferior al mínim permès');
      return;
    }
    if (
      new BigNumber(maxPerWallet.toString()).gt(0) &&
      new BigNumber(userDeposit.toString()).plus(amountInWei).gt(maxPerWallet.toString())
    ) {
      setErrorMessage('Superes el màxim permès per usuari');
      return;
    }
    if (
      new BigNumber(maxTotalProject.toString()).gt(0) &&
      new BigNumber(currentFunds.toString()).plus(amountInWei).gt(maxTotalProject.toString())
    ) {
      setErrorMessage('Superes el màxim total permès del projecte');
      return;
    }

    doDeposit(BigInt(amountInWei.toFixed(0)));
    setDepositAmount('');
  };

  return (
    <AuthRedirectWrapper>
      <div className='rounded-xl bg-white p-6 text-center w-2/3'>
        <h1 className='text-xl'>CROWDFUNDING</h1>
        <p className='text-gray-400 mb-6'>
          Crowdfunding per recaptar diners per fer una implantació de blockchain
          per gestionar els expedients acadèmics dels alumnes d'institut
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <OutputContainer>
            <h2 className='text-lg'>DINERS A RECAPTAR</h2>
            <h3 className='text-lg'>
              {formatAmount({ input: targetAmount.toString(), digits: 3 })} EGLD
            </h3>
          </OutputContainer>
          
          <OutputContainer>
           <h2 className='text-lg'>DINERS RECAPTATS</h2>
           <h3 className='text-lg mb-1'>
            {formatAmount({ input: currentFunds.toString(), digits: 3 })} EGLD
            </h3>
  <div className='w-full h-2 bg-gray-200 rounded-full'>
    <div
      className='h-2 bg-green-500 rounded-full transition-all duration-300'
      style={{ width: `${progressFundingPercent}%` }}
    ></div>
  </div>
  <p className='text-sm text-gray-500 mt-1'>
    Progrés: {progressFundingPercent.toFixed(0)}%
  </p>
</OutputContainer>

          <OutputContainer>
            <h2 className='text-lg'>DATA LÍMIT</h2>
            <h3 className='text-lg'>{formatDate(deadline)}</h3>
          </OutputContainer>
        </div>

        <div className='grid grid-cols-3 gap-4 mt-3'>
          <OutputContainer>
            <h2 className='text-lg'>EL MEU DIPÒSIT</h2>
            <h3 className='text-lg'>
              {userDeposit
                ? formatAmount({ input: userDeposit.toString(), digits: 3 })
                : ' - '}
              EGLD
            </h3>
          </OutputContainer>
          <OutputContainer className='col-span-2'>
            <div className='flex flex-col items-center gap-2 p-5'>
              <div className='flex w-full items-center gap-4'>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder='Quantitat en EGLD'
                  className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  disabled={isAfterDeadline}
                />
                <button
                  onClick={handleDeposit}
                  className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50'
                  disabled={isAfterDeadline}
                >
                  Dipositar
                </button>
              </div>
              {isAfterDeadline && (
                <p className='text-red-500 text-sm'>Ja ha passat la data límit.</p>
              )}
              {errorMessage && (
                <p className='text-red-500 text-sm'>{errorMessage}</p>
              )}
              <div className="mt-6 text-sm text-gray-500">
  <p><strong>Wallet connectat:</strong> {address}</p>
  <p><strong>Wallet del propietari:</strong> {ownerAddress}</p>
  <p><strong>Contracte:</strong> {contractAddress}</p>
</div>

            </div>
          </OutputContainer>
        </div>

        {address === ownerAddress && (
          <div className='mt-6 border-t pt-4'>
            <h2 className='text-lg font-semibold'>Configura el mínim per transacció</h2>
            <div className='flex items-center gap-4 mt-2'>
              <input
                type='number'
                step='0.0001'
                value={newMin}
                onChange={(e) => setNewMin(e.target.value)}
                placeholder='Nou mínim en EGLD'
                className='p-2 border border-gray-300 rounded-lg w-1/2'
              />
              <button
                onClick={handleSetMinDeposit}
                className='bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition'
              >
                Actualitza mínim
              </button>
            </div>
            <p className='text-sm text-gray-500 mt-2'>
              Mínim actual: {Number(minDeposit.toString()) / 1e18} EGLD
            </p>

            <h2 className='text-lg font-semibold mt-6'>Configura el màxim per wallet</h2>
            <div className='flex items-center gap-4 mt-2'>
              <input
                type='number'
                step='0.0001'
                value={newMax}
                onChange={(e) => setNewMax(e.target.value)}
                placeholder='Nou màxim en EGLD'
                className='p-2 border border-gray-300 rounded-lg w-1/2'
              />
              <button
                onClick={handleSetMaxPerWallet}
                className='bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition'
              >
                Actualitza màxim
              </button>
            </div>
            <p className='text-sm text-gray-500 mt-2'>
              Màxim actual: {Number(maxPerWallet.toString()) / 1e18} EGLD
            </p>

            <div className='mt-6'>
              <OutputContainer>
                <h2 className='text-lg font-semibold mt-6'>Configura el màxim total del projecte</h2>
                <div className='flex items-center gap-4 mt-2'>
                  <input
                    type='number'
                    step='0.0001'
                    value={newMaxTotal}
                    onChange={(e) => setNewMaxTotal(e.target.value)}
                    placeholder='Nou màxim total en EGLD'
                    className='p-2 border border-gray-300 rounded-lg w-1/2'
                  />
                  <button
                    onClick={handleSetMaxTotal}
                    className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition'
                  >
                    Actualitza màxim projecte
                  </button>
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                Màxim total actual: {new BigNumber(maxTotalProject.toString()).dividedBy(1e18).toFixed(0)} EGLD
              </p>


                
              

              </OutputContainer>
            </div>
          </div>
        )}
      </div>
    </AuthRedirectWrapper>
  );
};
