const chai = require('chai');
const { expect } = chai;
const { solidity } = require('ethereum-waffle');
chai.use(solidity);
const hardhat = require('hardhat');
const { deployments, ethers } = hardhat;
const { parseEther } = ethers.utils;
const ether = parseEther;

describe('Depositor', () => {
    let deployer, user;
    let dai, usdc, usdt, vault, gauge, depositor;

    beforeEach(async () => {
        await deployments.fixture(['v3', 'NativeStrategyCurve3Crv']);
        [deployer, , , user] = await ethers.getSigners();
        const DAI = await deployments.get('DAI');
        dai = await ethers.getContractAt('MockERC20', DAI.address);
        const USDC = await deployments.get('USDC');
        usdc = await ethers.getContractAt('MockERC20', USDC.address);
        const USDT = await deployments.get('USDT');
        usdt = await ethers.getContractAt('MockERC20', USDT.address);
        const Vault = await deployments.get('VaultStables');
        vault = await ethers.getContractAt('Vault', Vault.address);
        const Gauge = await deployments.get('VaultStablesGauge');
        gauge = await ethers.getContractAt('LiquidityGaugeV2', Gauge.address);
        const Depositor = await deployments.get('Depositor');
        depositor = await ethers.getContractAt('Depositor', Depositor.address);

        await dai.connect(user).faucet(ether('100000000'));
        await usdc.connect(user).faucet('100000000000000');
        await usdt.connect(user).faucet('100000000000000');
        await dai.connect(user).approve(Depositor.address, ethers.constants.MaxUint256);
        await usdc.connect(user).approve(Depositor.address, ethers.constants.MaxUint256);
        await usdt.connect(user).approve(Depositor.address, ethers.constants.MaxUint256);
    });

    describe('depositVault', () => {
        context('when the gauge is set', () => {
            it('should give gauge tokens to the user', async () => {
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
                await depositor
                    .connect(user)
                    .depositVault(vault.address, dai.address, ether('100'));
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(ether('100'));
            });
        });

        context('when the gauge is unset', () => {
            beforeEach(async () => {
                await vault.connect(deployer).setGauge(ethers.constants.AddressZero);
            });

            it('should give vault tokens to the user', async () => {
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
                await depositor
                    .connect(user)
                    .depositVault(vault.address, dai.address, ether('100'));
                expect(await vault.balanceOf(user.address)).to.be.equal(ether('100'));
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
            });
        });
    });

    describe('depositMultipleVault', () => {
        context('when the gauge is set', () => {
            it('should give gauge tokens to the user', async () => {
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
                await depositor
                    .connect(user)
                    .depositMultipleVault(
                        vault.address,
                        [dai.address, usdc.address, usdt.address],
                        [ether('100'), '100000000', '100000000']
                    );
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(ether('300'));
            });
        });

        context('when the gauge is unset', () => {
            beforeEach(async () => {
                await vault.connect(deployer).setGauge(ethers.constants.AddressZero);
            });

            it('should give vault tokens to the user', async () => {
                expect(await vault.balanceOf(user.address)).to.be.equal(0);
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
                await depositor
                    .connect(user)
                    .depositMultipleVault(
                        vault.address,
                        [dai.address, usdc.address, usdt.address],
                        [ether('100'), '100000000', '100000000']
                    );
                expect(await vault.balanceOf(user.address)).to.be.equal(ether('300'));
                expect(await gauge.balanceOf(user.address)).to.be.equal(0);
            });
        });
    });
});
