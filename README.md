# try-s2s-vuex-201801
try [s2s](https://github.com/akameco/s2s) at vuex in 2018/01

# What is this?

![gif sample](https://github.com/shinshin86/try-s2s-vuex-201801/blob/master/gif/s2s_vuex_sample.gif?raw=true)



And generate test code automatically.



![gif generate test code sample](https://github.com/shinshin86/try-s2s-vuex-201801/blob/master/gif/s2s_vuex_generate_test_code.gif?raw=true)



Details of this project are in this Japanese post.<br>
[vuexのボイラープレートをbabelで飛び越えろ！ -> s2sを使ってソースコードからソースコードへのリアルタイムコード生成をしてみた、3歩目](https://qiita.com/shinshin86/items/d68cdce126a61b8f7f8e)

# How to set up

```bash
# Clone
git clone https://github.com/shinshin86/try-s2s-vuex-201801.git

# Change directory
cd try-s2s-vuex-201801

# Insatll
yarn

# Start your editer
atom .

# Start s2s
yarn run s2s
```



# How to plugin build

Build "try-vuex-plugin" at this command.

```bash
yarn run build
```



## Development

```bash
# test(snapshot test, using jest)
yarn run test

# code format (using prettier)
yarn run fmt
```

