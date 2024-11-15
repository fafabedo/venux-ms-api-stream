<?php
namespace Deployer;

require 'recipe/common.php';

// Project name
set('application', 'Venux MS Stream');
set('remote_user', 'fabricio');
set('keep_releases', 3);
set('pm2_app_name', 'video-stream.venux-channel.com');


// Project repository
set('repository', 'git@github.com:fafabedo/venux-ms-api-stream.git');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', true); 

// Shared files/dirs between deploys 
set('shared_files', []);
set('shared_dirs', []);

// Writable dirs by web server 
set('writable_dirs', []);


// Hosts
host('video-stream.venux-channel.com')
// host('192.168.50.150')
  ->stage('prod')
  ->user('fabricio')
  ->identityFile('~/.ssh/id_rsa')
  ->forwardAgent(FALSE)
  ->set('deploy_path', '/home/fabricio/Apps/ms-adult-stream');
    

// Tasks

desc('Deploy your project');
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:lock',
    'deploy:release',
    'deploy:update_code',
    'deploy:shared',
    'deploy:writable',
    // 'deploy:vendors',
    'app:build',
    'deploy:clear_paths',
    'deploy:symlink',
    'pm2:restart',
    'deploy:unlock',
    'cleanup',
    'success'
]);

// [Optional] If deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');


task('app:build', function() {
    cd('{{release_path}}');
    run('node --version', ['timeout' => null]);
    run('/usr/local/bin/yarn install', ['timeout' => null]);
    // run('/usr/local/bin/yarn add sharp --ignore-engines');
});

task('pm2:restart', [
  'pm2:kill',
  'pm2:start',
]);

task('pm2:kill', function() {
  cd('{{release_path}}');
  run('pm2 delete {{pm2_app_name}}', ['timeout' => null]);
});

task('pm2:start', function() {
  cd('{{release_path}}');
  run('pm2 start', ['timeout' => null]);
});