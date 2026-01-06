#!/bin/bash
# 创建一个最小的1x1透明PNG (base64编码)
# 这是一个有效的1x1透明PNG的base64
PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 创建所有需要的图标文件
for name in home home-active chat chat-active clock clock-active account account-active; do
    echo "$PNG_BASE64" | base64 -d > "${name}.png"
    echo "Created ${name}.png"
done

echo "All icons created successfully!"
