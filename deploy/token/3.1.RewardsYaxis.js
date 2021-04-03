module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, execute } = deployments;
    const { deployer } = await getNamedAccounts();
    const YAXIS = await deployments.get('YaxisToken');

    const Rewards = await deploy('RewardsYaxis', {
        contract: 'Rewards',
        from: deployer,
        log: true,
        args: [YAXIS.address, YAXIS.address, 7776000]
    });

    await execute('RewardsYaxis', { from: deployer }, 'setRewardDistribution', deployer);
    await execute(
        'YaxisToken',
        { from: deployer },
        'transfer',
        Rewards.address,
        ethers.utils.parseEther('750000')
    );
};

module.exports.tags = ['rewards'];