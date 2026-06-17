#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 用于创建表结构和插入初始数据
 */

// 首先加载环境变量
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const fs = require('fs');
const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行SQL
    await pool.query(sql);
    console.log('✓ 数据库表结构创建成功');

    // 创建测试账号
    await createTestAccounts();

    console.log('\n✅ 数据库初始化完成!');
    console.log('\n测试账号信息:');
    console.log('家长账号: 13800138000 / 123456');
    console.log('学生账号: 13900139000 / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

async function createTestAccounts() {
  console.log('\n创建测试账号...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  // 创建家长账号
  const parentResult = await pool.query(
    `INSERT INTO users (phone, password_hash, nickname, role) 
     VALUES ($1, $2, $3, $4) 
     ON CONFLICT (phone) DO NOTHING 
     RETURNING id, phone, nickname, role`,
    ['13800138000', passwordHash, '测试家长', 'parent']
  );

  if (parentResult.rows.length > 0) {
    console.log('✓ 家长账号创建成功');
  } else {
    console.log('ℹ 家长账号已存在');
  }

  // 创建学生账号
  const studentResult = await pool.query(
    `INSERT INTO users (phone, password_hash, nickname, role) 
     VALUES ($1, $2, $3, $4) 
     ON CONFLICT (phone) DO NOTHING 
     RETURNING id, phone, nickname, role`,
    ['13900139000', passwordHash, '测试学生', 'student']
  );

  if (studentResult.rows.length > 0) {
    console.log('✓ 学生账号创建成功');
    
    // 绑定家长和学生
    await pool.query(
      `INSERT INTO parent_student_bindings (parent_id, student_id, device_name, device_type) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (parent_id, student_id) DO NOTHING`,
      [studentResult.rows[0].id, parentResult.rows[0].id, '平板设备', 'android_tablet']
    );
    console.log('✓ 家长学生绑定成功');
  } else {
    console.log('ℹ 学生账号已存在');
  }
}

initializeDatabase();
